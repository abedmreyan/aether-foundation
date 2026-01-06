
import { ColumnDefinition, ColumnType, TableSchema } from "../types";

export const parseCSV = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return resolve([]);
      
      // Basic CSV parser handling quotes and commas
      const rows = text.split('\n').map(row => {
        const result: string[] = [];
        let cell = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
          } else {
            cell += char;
          }
        }
        result.push(cell.trim());
        return result;
      }).filter(r => r.length > 0 && r[0] !== '');
      
      resolve(rows);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

const inferType = (value: string): ColumnType => {
  if (!value) return 'VARCHAR';
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)) return 'UUID';
  if (/^\d+$/.test(value)) return 'INTEGER';
  if (/^\d*\.\d+$/.test(value)) return 'DECIMAL';
  if (/^(true|false|yes|no|0|1)$/i.test(value)) return 'BOOLEAN';
  if (!isNaN(Date.parse(value)) && value.length > 5) return 'DATE';
  if (value.length > 255) return 'TEXT';
  return 'VARCHAR';
};

export const generateSchema = (fileName: string, rawData: string[][]): TableSchema => {
  const headers = rawData[0];
  const sampleRow = rawData[1] || rawData[0].map(() => ''); // Fallback if empty
  
  // Sanitize Table Name
  const tableName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

  const columns: ColumnDefinition[] = headers.map((header, index) => {
    const cleanName = header.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const sample = sampleRow[index];
    const type = inferType(sample);
    
    // Heuristic for Primary Key: contains "id" and is the first column or explicitly named "id"
    const isPrimaryKey = (cleanName === 'id' || cleanName === `${tableName}_id`);

    return {
      name: cleanName,
      type,
      isPrimaryKey,
      isForeignKey: false, // Will be determined later when comparing tables
      sampleValue: sample
    };
  });

  return {
    tableName,
    columns,
    rowCount: rawData.length - 1,
    rawData: rawData.slice(0, 50) // Store subset
  };
};

export const detectRelationships = (schemas: TableSchema[]): TableSchema[] => {
  // Deep copy to avoid mutation issues during react renders if strict mode is on
  const updatedSchemas = JSON.parse(JSON.stringify(schemas)) as TableSchema[];

  updatedSchemas.forEach(sourceTable => {
    sourceTable.columns.forEach(col => {
      if (col.isPrimaryKey) return; // Skip PKs

      // Look for a matching PK in other tables
      // Convention: foreign key often named "table_id" or just matching the PK name of another table
      updatedSchemas.forEach(targetTable => {
        if (sourceTable.tableName === targetTable.tableName) return;

        const targetPK = targetTable.columns.find(c => c.isPrimaryKey);
        if (!targetPK) return;

        // Check matches: 
        // 1. Exact Name Match (e.g. student_id === student_id)
        // 2. Convention Match (e.g. student_id === id in students table)
        const isExactMatch = col.name === targetPK.name;
        const isConventionMatch = col.name === `${targetTable.tableName}_id`;

        if (isExactMatch || isConventionMatch) {
           col.isForeignKey = true;
           col.references = {
             table: targetTable.tableName,
             column: targetPK.name
           };
        }
      });
    });
  });

  return updatedSchemas;
};
