// Example: Entity CRUD Operations
// Shows how to create, read, update, and delete entities

import { useCRM } from '../context';
import type { CRMEntity } from '../types';

export async function entityCrudExamples() {
    const { getEntities, createEntity, updateEntity, deleteEntity } = useCRM();

    // ==========================================================================
    // CREATE - Add a new entity
    // ==========================================================================
    const newStudent = await createEntity('students', {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        stage: 'new',
    });
    console.log('Created:', newStudent);

    // ==========================================================================
    // READ - Get entities with optional filters
    // ==========================================================================

    // Get all students
    const allStudents = await getEntities('students');

    // Get students in a specific stage
    const newStudents = await getEntities('students', { stage: 'new' });

    // Get a specific student by ID
    const student = await getEntities('students', { id: 'student-123' });

    // ==========================================================================
    // UPDATE - Modify an existing entity
    // ==========================================================================
    await updateEntity('students', 'student-123', {
        stage: 'contacted',
        notes: 'Called on Dec 15',
    });

    // ==========================================================================
    // DELETE - Remove an entity
    // ==========================================================================
    await deleteEntity('students', 'student-123');
}

// Key patterns:
// 1. Always use useCRM() hook for entity operations
// 2. entityType is the pipeline's entityType (e.g., 'students', 'tutors')
// 3. Filters are optional, defaults to all entities
// 4. Updates merge with existing data
