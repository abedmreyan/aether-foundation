# Project TODO

## Phase 1: Widget Customization & Preview Page
- [x] Design widget customization interface with color, size, position controls
- [x] Implement live preview panel for widget appearance
- [x] Add widget code generation for embedding
- [x] Create widget configuration storage in database

## Phase 2: Call Center Dashboard
- [x] Design agent dashboard layout with sidebar navigation
- [x] Implement incoming calls/chats queue interface
- [x] Create call logs table with filtering and search
- [x] Add call recordings player and management
- [x] Implement agent status controls (available, busy, offline)
- [ ] Add real-time notifications for incoming communications

## Phase 3: Embeddable Widget
- [x] Create standalone widget component with chat interface
- [x] Make widget responsive and mobile-compatible (iOS/Android)
- [x] Add widget initialization script for client websites and mobile apps
- [x] Implement widget-to-dashboard communication channel
- [x] Add chat message storage and retrieval
- [x] Create widget embed code generator
- [ ] Add mobile SDK documentation

## Phase 4: VoIP Integration
- [ ] Research and select VoIP provider (Twilio/Agora/custom WebRTC)
- [ ] Integrate VoIP service for voice calls
- [ ] Implement call routing to available agents
- [ ] Add call quality monitoring

## Phase 5: Testing & Deployment
- [ ] Test widget embedding on sample websites
- [ ] Test call center dashboard with multiple agents
- [ ] Verify call recording and playback
- [ ] Performance testing for concurrent calls/chats
- [ ] Create user guide documentation


## Bugs
- [x] Fix authentication redirect loop - users get logged out after OAuth callback (resolved by opening URL directly)

## Phase 3.1: Native Mobile SDKs
- [x] Add platform selection (Website/Android/iOS) to widget creation flow
- [x] Generate platform-specific integration guides
- [x] Add SDK download/installation instructions
- [ ] Create Android SDK with native UI components
- [ ] Implement Android push notifications integration
- [ ] Add Android VoIP call handling with CallKit equivalent
- [ ] Create iOS SDK with native UI components  
- [ ] Implement iOS push notifications (APNs)
- [ ] Add iOS VoIP support with CallKit integration

## Phase 5: Real-time Agent Dashboard
- [x] Implement Socket.io for real-time communication
- [x] Create agent session management (accept/reject/end sessions)
- [x] Build live chat interface for agents to respond to visitors
- [x] Add real-time session queue with notifications
- [x] Implement typing indicators for both agents and visitors
- [x] Add session status updates (waiting, active, ended)
- [x] Create message history view for agents
- [x] Add agent availability status management

## Navigation Improvements
- [x] Add Agent Chat link to main header navigation

## Agent Chat Enhancements
- [x] Add status filter (all, waiting, active, ended)
- [x] Add date range filter for session history
- [x] Add widget filter to show sessions by specific widget
- [x] Add search functionality for session content

## Agent Status & Notifications
- [x] Implement agent status toggle (Available, Busy, Offline)
- [x] Add browser notifications for new chat sessions
- [x] Add browser notifications for new messages
- [x] Add notification sound alerts
- [x] Request notification permissions on agent login

## Analytics Dashboard
- [x] Create analytics page with session metrics
- [x] Add average response time tracking
- [x] Add sessions per agent statistics
- [x] Add widget performance metrics
- [x] Add date range selector for analytics
- [ ] Add peak hours visualization

## Canned Responses
- [x] Create canned responses database schema
- [x] Add canned responses management UI
- [x] Add quick reply selector in chat interface
- [x] Add category organization for responses
- [ ] Add response templates with variables

## Twilio VoIP Integration
- [x] Create settings page for Twilio credentials management
- [x] Add Twilio settings database schema
- [x] Install Twilio SDK and dependencies
- [x] Create Twilio voice call endpoints (initiate, answer, end)
- [x] Add Twilio access token generation for client-side
- [ ] Implement voice call UI in widget
- [ ] Add incoming call notification in agent dashboard
- [ ] Implement call answer/reject functionality for agents
- [ ] Add active call interface with mute/hold/transfer controls
- [ ] Store call metadata and duration in database
- [ ] Test end-to-end voice calling flow

## AI Chatbot System
- [x] Create AI chatbot database schema (chatbots, knowledge bases, MCP servers)
- [x] Build chatbot management page (create, edit, delete chatbots)
- [x] Implement AI prompt template library with common use cases
- [x] Add RAG knowledge base upload and management
- [x] Create MCP server configuration interface
- [x] Implement MCP server setup wizard with documentation
- [x] Integrate LLM API for chatbot responses
- [x] Add chatbot-to-widget assignment system
- [x] Implement context injection from MCP servers
- [x] Create chatbot testing interface

## Automation Workflows
- [ ] Create workflow database schema (workflows, triggers, actions, conditions)
- [ ] Build visual workflow builder interface
- [ ] Implement trigger types (new message, call, status change, time-based)
- [ ] Add condition builder (if/else, filters, multiple conditions)
- [ ] Implement action types (send message, update status, webhook, email)
- [ ] Add webhook configuration and testing
- [ ] Implement message routing rules
- [ ] Add call routing and load balancing logic
- [ ] Create AI-powered follow-up email system
- [ ] Add workflow execution logging and analytics
- [ ] Implement workflow testing and debugging tools

## UI/UX Redesign - Aether Foundation Branding
- [x] Implement Aether Foundation color palette (Deep Blue #003251, Teal #05B3B4, Vibrant Orange #FF7A11)
- [x] Add Raleway font for headings and UI elements
- [x] Create modern sidebar navigation layout
- [x] Update logo to Aether Foundation branding
- [x] Redesign all pages with consistent CRM-style layout
- [x] Apply brand guidelines to buttons, cards, and interactive elements
- [x] Update theme colors in index.css
- [x] Create unified dashboard layout component

## Logo Update & Theme Cleanup
- [x] Replace logo with new Aether Foundation logo
- [x] Clean up remaining old theme elements
- [x] Ensure consistent branding across all pages

## Intelligent AI Chatbot Routing System
- [x] Add chatbot assignment field to widget schema
- [x] Create chatbot routing rules database schema
- [x] Build visual workflow builder for chatbot routing
- [x] Implement routing execution engine backend
- [x] Add condition evaluation logic (keyword detection, intent analysis)
- [x] Integrate MCP server queries for customer data
- [x] Create handoff logic between AI agents (welcome → sales/support)
- [x] Update chat message handler to use routing engine
- [x] Add session chatbot history tracking
- [ ] Implement routing analytics and tracking
- [ ] Add chatbot selection UI in widget customizer

## UI Cleanup & Fixes
- [x] Update logo to transparent version across all pages
- [x] Fix widget save button color changing with widget icon
- [x] Fix double sidebar issue on chatbot routing page
- [x] Remove old navigation bars from all pages
- [x] Make sidebar collapsible (show only icons when not hovered)
- [x] Ensure logo and title only appear in sidebar

## Logo Update
- [x] Replace current logo with full Aether Foundation logo (with text)

## Documentation
- [x] Create comprehensive project documentation

## GitHub Export
- [ ] Create .gitignore file
- [ ] Generate clean archive excluding node_modules and build artifacts
