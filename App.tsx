
import React, { useState, createContext, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { parseCSV, generateSchema, detectRelationships } from './services/dataService';
import { db } from './services/database';
import { platformDb } from './services/platformDatabase';
import { generateConsultantResponse, generatePipelineRecommendations, analyzeDataSchemas } from './services/geminiService';
import {
  AppState,
  GlobalContextType,
  BusinessProfile,
  UploadedFile,
  Message,
  PipelineRecommendation,
  User,
  Company,
  TableSchema,
  CloudConfig,
  PipelineConfig,
  RoleDefinition,
  DbConnectionConfig
} from './types';

const defaultProfile: BusinessProfile = {
  name: '',
  industry: '',
  description: '',
  challenges: ''
};

export const GlobalContext = createContext<GlobalContextType>({
  currentView: AppState.LANDING,
  setView: () => { },
  businessProfile: defaultProfile,
  updateBusinessProfile: () => { },
  uploadedFiles: [],
  dataSchemas: [],
  addFile: async () => { },
  removeFile: () => { },
  updateFileDescription: () => { },
  refineSchemas: async () => { },
  chatHistory: [],
  addMessage: () => { },
  pipelines: [],
  setPipelines: () => { },
  user: null,
  company: null,
  login: async () => false,
  logout: () => { },
  pipelineConfigs: [],
  roleDefinitions: [],
  cloudConfig: { enabled: false, apiUrl: '', apiKey: '', isConnected: false },
  updateCloudConfig: () => { }
});

const App: React.FC = () => {
  const [currentView, setView] = useState<AppState>(AppState.LANDING);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultProfile);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dataSchemas, setDataSchemas] = useState<TableSchema[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRecommendation[]>([]);

  // Multi-tenant state
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [pipelineConfigs, setPipelineConfigs] = useState<PipelineConfig[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([]);
  const [dbConnection, setDbConnection] = useState<DbConnectionConfig | null>(null);

  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(db.config);

  const updateBusinessProfile = (data: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => {
      const updated = { ...prev, ...data };
      if (user) db.updateProfile(user.email, updated);
      return updated;
    });
  };

  const updateCloudConfig = (config: Partial<CloudConfig>) => {
    db.updateConfig(config);
    setCloudConfig(db.config);
  };

  const addFile = async (file: File, description: string) => {
    if (!user) return;

    const rawData = await parseCSV(file);
    const newSchema = generateSchema(file.name, rawData);

    await db.createTable(user.email, newSchema);

    const rows = rawData.slice(1);
    await db.insertRows(user.email, newSchema.tableName, rows);

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      description: description
    };

    await db.saveFileRecord(user.email, newFile);

    setUploadedFiles(prev => [...prev, newFile]);

    const allSchemas = [...dataSchemas, newSchema];
    const resolvedSchemas = detectRelationships(allSchemas);

    for (const s of resolvedSchemas) {
      await db.createTable(user.email, s);
    }

    setDataSchemas(resolvedSchemas);
  };

  const removeFile = async (id: string) => {
    if (!user) return;
    await db.deleteFileRecord(user.email, id);
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileDescription = (id: string, desc: string) => {
    setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, description: desc } : f));
  };

  const refineSchemas = async () => {
    if (!user || dataSchemas.length === 0) return;

    const optimizedSchemas = await analyzeDataSchemas(dataSchemas);
    setDataSchemas(optimizedSchemas);

    for (const s of optimizedSchemas) {
      await db.createTable(user.email, s);
    }
  };

  const addMessage = (msg: Message) => {
    setChatHistory(prev => [...prev, msg]);
  };

  // Multi-tenant login using platformDb
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await platformDb.authenticate(email, password);

      if (result.success && result.user && result.company) {
        setUser(result.user);
        setCompany(result.company);

        // Load company-specific data
        const [configs, roles, connection] = await Promise.all([
          platformDb.getPipelineConfigs(result.company.id),
          platformDb.getRoleDefinitions(result.company.id),
          platformDb.getDbConnection(result.company.id)
        ]);

        setPipelineConfigs(configs);
        setRoleDefinitions(roles);
        setDbConnection(connection);

        // Also try legacy login for backward compatibility
        const legacyAuth = await db.authenticate(email, password);
        if (legacyAuth) {
          const data = await db.getUserData(email);
          if (data) {
            setBusinessProfile(data.profile || defaultProfile);
            setUploadedFiles(data.files || []);
            setDataSchemas(data.schemas || []);
            setPipelines(data.pipelines || []);
          }
        }

        setView(AppState.DASHBOARD);
        return true;
      }

      // Fall back to legacy auth
      const legacyUser = await db.authenticate(email, password);

      if (legacyUser) {
        // Convert legacy user to new format
        const convertedUser: User = {
          id: legacyUser.email,
          companyId: 'legacy',
          email: legacyUser.email,
          name: legacyUser.name,
          role: legacyUser.role === 'admin' ? 'admin' : 'team',
          avatar: legacyUser.avatar,
          createdAt: Date.now()
        };

        setUser(convertedUser);

        const data = await db.getUserData(email);
        if (data) {
          setBusinessProfile(data.profile || defaultProfile);
          setUploadedFiles(data.files || []);
          setDataSchemas(data.schemas || []);
          setPipelines(data.pipelines || []);

          if (data.files && data.files.length > 0) {
            setView(AppState.DASHBOARD);
          } else {
            setView(AppState.ONBOARDING);
          }
        } else {
          setView(AppState.ONBOARDING);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login failed", e);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await db.registerUser(email, name, password);
      await login(email, password);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setPipelineConfigs([]);
    setRoleDefinitions([]);
    setDbConnection(null);
    setView(AppState.LANDING);
    setBusinessProfile(defaultProfile);
    setUploadedFiles([]);
    setDataSchemas([]);
    setPipelines([]);
    setChatHistory([]);
  };

  const savePipelinesToDB = async (pipes: PipelineRecommendation[]) => {
    if (user) {
      await db.savePipelines(user.email, pipes);
      setPipelines(pipes);
    }
  };

  return (
    <GlobalContext.Provider value={{
      currentView,
      setView,
      businessProfile,
      updateBusinessProfile,
      uploadedFiles,
      dataSchemas,
      addFile,
      removeFile,
      updateFileDescription,
      refineSchemas,
      chatHistory,
      addMessage,
      pipelines,
      setPipelines: savePipelinesToDB,
      user,
      company,
      login,
      logout,
      register,
      pipelineConfigs,
      roleDefinitions,
      cloudConfig,
      updateCloudConfig
    }}>
      <div className="antialiased text-darkGray font-sans">
        {currentView === AppState.LANDING && <Landing />}
        {currentView === AppState.ONBOARDING && <Onboarding />}
        {currentView === AppState.DASHBOARD && <Dashboard dbConnection={dbConnection} />}
      </div>
    </GlobalContext.Provider>
  );
};

export default App;
