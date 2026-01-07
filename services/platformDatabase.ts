/**
 * Platform Database Service
 * Aether's internal database for managing companies, users, and configurations
 */

import {
    Company,
    CompanySettings,
    User,
    UserRole,
    AuthResult,
    DbConnectionConfig,
    PipelineConfig,
    RoleDefinition
} from '../types';
import { createDefaultRoles } from './permissions';

// ===== STORAGE KEYS =====
const PLATFORM_KEY = 'aether_platform_db_v1';

// ===== INTERNAL TYPES =====

interface PlatformState {
    companies: Company[];
    users: (User & { passwordHash: string })[];
    dbConnections: DbConnectionConfig[];
    pipelineConfigs: PipelineConfig[];
    roleDefinitions: RoleDefinition[];
}

const defaultState: PlatformState = {
    companies: [],
    users: [],
    dbConnections: [],
    pipelineConfigs: [],
    roleDefinitions: []
};

// ===== PLATFORM DATABASE CLASS =====

class PlatformDatabase {
    private state: PlatformState;

    constructor() {
        const stored = localStorage.getItem(PLATFORM_KEY);
        this.state = stored ? JSON.parse(stored) : defaultState;

        // Seed demo company and user if empty
        if (this.state.companies.length === 0) {
            this.seedDemoData();
        }
    }

    private save(): void {
        localStorage.setItem(PLATFORM_KEY, JSON.stringify(this.state));
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Simple hash for demo purposes - use bcrypt in production
    private hashPassword(password: string): string {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    private seedDemoData(): void {
        const now = Date.now();

        // Create Ajnabi company
        const ajnabiCompany: Company = {
            id: 'ajnabi-001',
            name: 'Ajnabi Tutoring',
            slug: 'ajnabi',
            plan: 'pro',
            settings: {
                branding: {
                    primaryColor: '#05B3B4',
                    accentColor: '#FF7A11'
                },
                defaults: {
                    defaultView: 'kanban',
                    entriesPerPage: 25
                }
            },
            createdAt: now,
            updatedAt: now
        };

        // Create demo admin user (legacy - keep for testing)
        const adminUser: User & { passwordHash: string } = {
            id: 'user-001',
            companyId: ajnabiCompany.id,
            email: 'admin@ajnabi.com',
            name: 'Ajnabi Admin',
            role: 'admin',
            avatar: 'AA',
            createdAt: now,
            passwordHash: this.hashPassword('password')
        };

        // Create demo sales user (legacy - keep for testing)
        const salesUser: User & { passwordHash: string } = {
            id: 'user-002',
            companyId: ajnabiCompany.id,
            email: 'sales@ajnabi.com',
            name: 'Sales Rep',
            role: 'sales',
            avatar: 'SR',
            createdAt: now,
            passwordHash: this.hashPassword('password')
        };

        // ===== PRODUCTION AJNABI USERS =====

        // Khaldoun - Management role
        const khaldounUser: User & { passwordHash: string } = {
            id: 'user-003',
            companyId: ajnabiCompany.id,
            email: 'khaldoun@ajnabi.co',
            name: 'Khaldoun',
            role: 'management',
            avatar: 'KH',
            createdAt: now,
            passwordHash: this.hashPassword('PASSWORD')
        };

        // Amin - Admin role
        const aminUser: User & { passwordHash: string } = {
            id: 'user-004',
            companyId: ajnabiCompany.id,
            email: 'amin@ajnabi.co',
            name: 'Amin',
            role: 'admin',
            avatar: 'AM',
            createdAt: now,
            passwordHash: this.hashPassword('PASSWORD')
        };

        // Abed - Admin role
        const abedUser: User & { passwordHash: string } = {
            id: 'user-005',
            companyId: ajnabiCompany.id,
            email: 'abed@ajnabi.co',
            name: 'Abed',
            role: 'admin',
            avatar: 'AB',
            createdAt: now,
            passwordHash: this.hashPassword('PASSWORD')
        };

        // Create default roles for Ajnabi
        const defaultRoles = createDefaultRoles(ajnabiCompany.id);

        // Create default pipelines for Ajnabi
        const defaultPipelines = this.createAjnabiPipelines(ajnabiCompany.id);

        // Create Supabase database connection for production
        const supabaseConnection: DbConnectionConfig = {
            id: 'conn-001',
            companyId: ajnabiCompany.id,
            type: 'supabase',
            name: 'Ajnabi Production Database',
            apiUrl: 'https://0ec90b57d6e95fcbda19832f.supabase.co',
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw',
            isActive: true,
            testStatus: 'connected',
            lastTestedAt: now
        };

        this.state.companies.push(ajnabiCompany);
        this.state.users.push(adminUser, salesUser, khaldounUser, aminUser, abedUser);
        this.state.roleDefinitions.push(...defaultRoles);
        this.state.pipelineConfigs.push(...defaultPipelines);
        this.state.dbConnections.push(supabaseConnection);

        this.save();
    }

    private createAjnabiPipelines(companyId: string): PipelineConfig[] {
        const now = Date.now();

        return [
            // Students Pipeline
            {
                id: 'students',
                companyId,
                name: 'Students Pipeline',
                description: 'Track student lifecycle from lead to completion',
                entityType: 'students',
                stages: [
                    { id: 'new', name: 'New', color: '#3B82F6', order: 1 },
                    { id: 'enrolled', name: 'Student Enrolled', color: '#10B981', order: 2 },
                    { id: 'overdue', name: 'Payment Overdue', color: '#EF4444', order: 3 },
                    { id: 'completed', name: 'Package Completed', color: '#8B5CF6', order: 4 }
                ],
                fields: [
                    { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true, showInKanban: true, showInTable: true, isSearchable: true, isSortable: true, order: 1 },
                    { id: 'email', name: 'email', type: 'email', label: 'Email', required: true, showInKanban: false, showInTable: true, isSearchable: true, isSortable: true, order: 2 },
                    { id: 'phone', name: 'phone', type: 'phone', label: 'Phone', required: true, showInKanban: true, showInTable: true, isSearchable: true, isSortable: false, order: 3 },
                    { id: 'notes', name: 'notes', type: 'textarea', label: 'Notes', required: false, showInKanban: false, showInTable: false, order: 4 }
                ],
                allowedRoles: ['admin', 'dev', 'management', 'sales', 'support'],
                isActive: true,
                createdAt: now,
                updatedAt: now
            },

            // Tutors Pipeline
            {
                id: 'tutors',
                companyId,
                name: 'Tutors Pipeline',
                description: 'Manage tutor applications and progression',
                entityType: 'tutors',
                stages: [
                    { id: 'applied', name: 'Application Submitted', color: '#6B7280', order: 1 },
                    { id: 'interview1', name: 'First Interview', color: '#3B82F6', order: 2 },
                    { id: 'docs', name: 'Pending Documents', color: '#F59E0B', order: 3 },
                    { id: 'interview2', name: 'Second Interview', color: '#3B82F6', order: 4 },
                    { id: 'interview3', name: 'Third Interview', color: '#3B82F6', order: 5 },
                    { id: 'contract', name: 'Contract Signed', color: '#10B981', order: 6 },
                    { id: 'trial', name: 'Trial Period', color: '#F59E0B', order: 7 },
                    { id: 'tier1', name: 'Tier One Tutor', color: '#8B5CF6', order: 8 },
                    { id: 'tier2', name: 'Tier Two Tutor', color: '#8B5CF6', order: 9 },
                    { id: 'tier3', name: 'Tier Three Tutor', color: '#8B5CF6', order: 10 },
                    { id: 'leader', name: 'Team Leader', color: '#EC4899', order: 11 }
                ],
                fields: [
                    { id: 'name', name: 'name', type: 'text', label: 'Full Name', required: true, showInKanban: true, showInTable: true, isSearchable: true, isSortable: true, order: 1 },
                    { id: 'email', name: 'email', type: 'email', label: 'Email', required: true, showInKanban: false, showInTable: true, isSearchable: true, isSortable: true, order: 2 },
                    { id: 'phone', name: 'phone', type: 'phone', label: 'Phone', required: true, showInKanban: true, showInTable: true, isSearchable: true, isSortable: false, order: 3 },
                    {
                        id: 'tier', name: 'tier', type: 'select', label: 'Tier', required: false, showInKanban: true, showInTable: true, isSortable: true, order: 4, options: [
                            { value: 'one', label: 'Tier 1', color: '#3B82F6' },
                            { value: 'two', label: 'Tier 2', color: '#8B5CF6' },
                            { value: 'three', label: 'Tier 3', color: '#EC4899' }
                        ]
                    },
                    { id: 'notes', name: 'notes', type: 'textarea', label: 'Notes', required: false, showInKanban: false, showInTable: false, order: 5 }
                ],
                allowedRoles: ['admin', 'dev', 'management'],
                isActive: true,
                createdAt: now,
                updatedAt: now
            },

            // Packages Pipeline
            {
                id: 'packages',
                companyId,
                name: 'Packages Pipeline',
                description: 'Track tutoring packages from creation to completion',
                entityType: 'packages',
                stages: [
                    { id: 'new', name: 'New', color: '#6B7280', order: 1 },
                    { id: 'assigned', name: 'Tutor Assigned', color: '#3B82F6', order: 2 },
                    { id: 'trial_scheduled', name: 'Trial Lesson Scheduled', color: '#F59E0B', order: 3 },
                    { id: 'rejected', name: 'Tutor Rejected', color: '#EF4444', order: 4 },
                    { id: 'reschedule', name: 'Reschedule Trial Lesson', color: '#F59E0B', order: 5 },
                    { id: 'approved', name: 'Tutor Approved', color: '#10B981', order: 6 },
                    { id: 'selected', name: 'Package Selected', color: '#3B82F6', order: 7 },
                    { id: 'pending_payment', name: 'Package Pending Payment', color: '#F59E0B', order: 8 },
                    { id: 'active', name: 'Package Active', color: '#10B981', order: 9 },
                    { id: 'completing', name: 'Completing Package', color: '#8B5CF6', order: 10 },
                    { id: 'completed', name: 'Package Completed', color: '#8B5CF6', order: 11 }
                ],
                fields: [
                    { id: 'studentId', name: 'studentId', type: 'relation', label: 'Student', required: true, showInKanban: true, showInTable: true, order: 1, relationConfig: { entityType: 'students', displayField: 'name' } },
                    { id: 'tutorId', name: 'tutorId', type: 'relation', label: 'Tutor', required: false, showInKanban: true, showInTable: true, order: 2, relationConfig: { entityType: 'tutors', displayField: 'name' } },
                    { id: 'subject', name: 'subject', type: 'text', label: 'Subject', required: false, showInKanban: true, showInTable: true, isSearchable: true, order: 3 },
                    { id: 'totalLessons', name: 'totalLessons', type: 'number', label: 'Total Lessons', required: false, showInKanban: false, showInTable: true, order: 4 },
                    { id: 'completedLessons', name: 'completedLessons', type: 'number', label: 'Completed Lessons', required: false, showInKanban: false, showInTable: true, order: 5 },
                    { id: 'price', name: 'price', type: 'currency', label: 'Price', required: false, showInKanban: false, showInTable: true, isFinancial: true, order: 6 },
                    { id: 'paidAmount', name: 'paidAmount', type: 'currency', label: 'Paid Amount', required: false, showInKanban: false, showInTable: true, isFinancial: true, order: 7 },
                    { id: 'notes', name: 'notes', type: 'textarea', label: 'Notes', required: false, showInKanban: false, showInTable: false, order: 8 }
                ],
                allowedRoles: ['admin', 'dev', 'management', 'sales'],
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        ];
    }

    // ===== COMPANY MANAGEMENT =====

    async createCompany(data: {
        name: string;
        slug: string;
        plan?: Company['plan'];
        settings?: CompanySettings;
    }): Promise<Company> {
        const existing = this.state.companies.find(c => c.slug === data.slug);
        if (existing) {
            throw new Error('Company with this slug already exists');
        }

        const now = Date.now();
        const company: Company = {
            id: this.generateId(),
            name: data.name,
            slug: data.slug,
            plan: data.plan || 'free',
            settings: data.settings || {},
            createdAt: now,
            updatedAt: now
        };

        this.state.companies.push(company);

        // Create default roles
        const defaultRoles = createDefaultRoles(company.id);
        this.state.roleDefinitions.push(...defaultRoles);

        this.save();
        return company;
    }

    async getCompany(id: string): Promise<Company | null> {
        return this.state.companies.find(c => c.id === id) || null;
    }

    async getCompanyBySlug(slug: string): Promise<Company | null> {
        return this.state.companies.find(c => c.slug === slug) || null;
    }

    async updateCompanySettings(id: string, settings: Partial<CompanySettings>): Promise<void> {
        const company = this.state.companies.find(c => c.id === id);
        if (!company) throw new Error('Company not found');

        company.settings = { ...company.settings, ...settings };
        company.updatedAt = Date.now();
        this.save();
    }

    // ===== USER MANAGEMENT =====

    async createUser(data: {
        companyId: string;
        email: string;
        name: string;
        password: string;
        role: UserRole;
        roleId?: string;
    }): Promise<User> {
        const existing = this.state.users.find(u => u.email === data.email);
        if (existing) {
            throw new Error('User with this email already exists');
        }

        const company = await this.getCompany(data.companyId);
        if (!company) {
            throw new Error('Company not found');
        }

        const now = Date.now();
        const user: User & { passwordHash: string } = {
            id: this.generateId(),
            companyId: data.companyId,
            email: data.email,
            name: data.name,
            role: data.role,
            roleId: data.roleId,
            avatar: data.name.substring(0, 2).toUpperCase(),
            createdAt: now,
            passwordHash: this.hashPassword(data.password)
        };

        this.state.users.push(user);
        this.save();

        // Return user without password hash
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

    async authenticate(email: string, password: string): Promise<AuthResult> {
        const user = this.state.users.find(
            u => u.email === email && u.passwordHash === this.hashPassword(password)
        );

        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }

        // Update last login
        user.lastLogin = Date.now();
        this.save();

        const company = await this.getCompany(user.companyId);

        const { passwordHash, ...safeUser } = user;
        return {
            success: true,
            user: safeUser,
            company: company || undefined,
            token: `demo-token-${Date.now()}`
        };
    }

    async getUsersByCompany(companyId: string): Promise<User[]> {
        return this.state.users
            .filter(u => u.companyId === companyId)
            .map(({ passwordHash, ...user }) => user);
    }

    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        const user = this.state.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        Object.assign(user, data);
        this.save();

        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

    async deleteUser(userId: string): Promise<void> {
        const index = this.state.users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error('User not found');

        this.state.users.splice(index, 1);
        this.save();
    }

    // ===== DATABASE CONNECTIONS =====

    async saveDbConnection(companyId: string, config: Omit<DbConnectionConfig, 'id' | 'companyId'>): Promise<DbConnectionConfig> {
        const id = this.generateId();
        const connection: DbConnectionConfig = {
            id,
            companyId,
            ...config
        };

        // Deactivate other connections for this company
        this.state.dbConnections.forEach(c => {
            if (c.companyId === companyId) c.isActive = false;
        });

        this.state.dbConnections.push(connection);
        this.save();
        return connection;
    }

    async getDbConnection(companyId: string): Promise<DbConnectionConfig | null> {
        return this.state.dbConnections.find(c => c.companyId === companyId && c.isActive) || null;
    }

    async getAllDbConnections(companyId: string): Promise<DbConnectionConfig[]> {
        return this.state.dbConnections.filter(c => c.companyId === companyId);
    }

    async updateDbConnection(connectionId: string, data: Partial<DbConnectionConfig>): Promise<void> {
        const connection = this.state.dbConnections.find(c => c.id === connectionId);
        if (!connection) throw new Error('Connection not found');

        Object.assign(connection, data);
        this.save();
    }

    // ===== PIPELINE CONFIGURATIONS =====

    async savePipelineConfig(companyId: string, config: Omit<PipelineConfig, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<PipelineConfig> {
        const now = Date.now();
        const pipeline: PipelineConfig = {
            id: this.generateId(),
            companyId,
            ...config,
            createdAt: now,
            updatedAt: now
        };

        this.state.pipelineConfigs.push(pipeline);
        this.save();
        return pipeline;
    }

    async getPipelineConfigs(companyId: string): Promise<PipelineConfig[]> {
        return this.state.pipelineConfigs.filter(p => p.companyId === companyId);
    }

    async getPipelineConfig(pipelineId: string): Promise<PipelineConfig | null> {
        return this.state.pipelineConfigs.find(p => p.id === pipelineId) || null;
    }

    async updatePipelineConfig(pipelineId: string, data: Partial<PipelineConfig>): Promise<void> {
        const pipeline = this.state.pipelineConfigs.find(p => p.id === pipelineId);
        if (!pipeline) throw new Error('Pipeline not found');

        Object.assign(pipeline, data, { updatedAt: Date.now() });
        this.save();
    }

    async deletePipelineConfig(pipelineId: string): Promise<void> {
        const index = this.state.pipelineConfigs.findIndex(p => p.id === pipelineId);
        if (index === -1) throw new Error('Pipeline not found');

        this.state.pipelineConfigs.splice(index, 1);
        this.save();
    }

    // ===== ROLE DEFINITIONS =====

    async saveRoleDefinition(companyId: string, role: Omit<RoleDefinition, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<RoleDefinition> {
        const now = Date.now();
        const roleDef: RoleDefinition = {
            id: this.generateId(),
            companyId,
            ...role,
            createdAt: now,
            updatedAt: now
        };

        this.state.roleDefinitions.push(roleDef);
        this.save();
        return roleDef;
    }

    async getRoleDefinitions(companyId: string): Promise<RoleDefinition[]> {
        return this.state.roleDefinitions.filter(r => r.companyId === companyId);
    }

    async getRoleDefinition(roleId: string): Promise<RoleDefinition | null> {
        return this.state.roleDefinitions.find(r => r.id === roleId) || null;
    }

    async updateRoleDefinition(roleId: string, data: Partial<RoleDefinition>): Promise<void> {
        const role = this.state.roleDefinitions.find(r => r.id === roleId);
        if (!role) throw new Error('Role not found');
        if (role.isSystemRole) throw new Error('Cannot modify system roles');

        Object.assign(role, data, { updatedAt: Date.now() });
        this.save();
    }

    async deleteRoleDefinition(roleId: string): Promise<void> {
        const role = this.state.roleDefinitions.find(r => r.id === roleId);
        if (!role) throw new Error('Role not found');
        if (role.isSystemRole) throw new Error('Cannot delete system roles');

        const index = this.state.roleDefinitions.findIndex(r => r.id === roleId);
        this.state.roleDefinitions.splice(index, 1);
        this.save();
    }
}

// Export singleton instance
export const platformDb = new PlatformDatabase();
