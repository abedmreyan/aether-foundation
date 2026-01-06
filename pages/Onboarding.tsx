
import React, { useContext, useState, useEffect } from 'react';
import { GlobalContext } from '../App';
import { AppState, Message } from '../types';
import { Button } from '../components/Button';
import { generateConsultantResponse, generatePipelineRecommendations } from '../services/geminiService';
import { UploadCloud, FileText, CheckCircle, ArrowRight, BrainCircuit, Database, Server, Trash2, Plus } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { 
    setView, 
    chatHistory, 
    addMessage, 
    addFile, 
    updateFileDescription,
    removeFile,
    uploadedFiles, 
    dataSchemas,
    updateBusinessProfile,
    setPipelines 
  } = useContext(GlobalContext);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDiscoveryComplete, setIsDiscoveryComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Please describe your core business model and the primary industry you operate in.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initial Setup
  useEffect(() => {
    if (chatHistory.length === 0) {
        // Initial state setup
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: Date.now() };
    addMessage(userMsg);
    
    const previousQuestionMsg: Message = { role: 'model', text: currentQuestion, timestamp: Date.now() };
    addMessage(previousQuestionMsg);

    setInput('');
    setIsProcessing(true);
    updateBusinessProfile({ description: input }); 

    try {
      let responseText = await generateConsultantResponse([...chatHistory, userMsg], input);
      
      if (responseText.includes('[ANALYSIS_COMPLETE]')) {
        responseText = responseText.replace('[ANALYSIS_COMPLETE]', '').trim();
        setIsDiscoveryComplete(true);
      }

      setCurrentQuestion(responseText);
    } catch (e) {
      console.error(e);
      setCurrentQuestion("Connection interrupted. Please elaborate on your previous point.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        // This now triggers the REAL parse logic in App.tsx
        await addFile(files[i], '');
      }
    }
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const fullDescription = chatHistory.filter(m => m.role === 'user').map(m => m.text).join(" ");
    
    // We now pass the REAL inferred schemas to Gemini
    const pipelines = await generatePipelineRecommendations(fullDescription, dataSchemas);
    setPipelines(pipelines);
    
    setTimeout(() => {
        setIsAnalyzing(false);
        setView(AppState.DASHBOARD);
    }, 2000);
  };

  const ProcessingState = () => (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
        <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-lightGray rounded-full"></div>
            <div className="absolute inset-0 border-4 border-teal rounded-full border-t-transparent animate-spin"></div>
            <BrainCircuit className="absolute inset-0 m-auto text-deepBlue w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-deepBlue font-semibold text-lg">Analyzing Input...</h3>
        <p className="text-gray-400 text-sm">The Architect is structuring your data profile</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-8 py-6 border-b border-lightGray flex justify-between items-center bg-white z-10">
         <div className="flex items-center gap-2 text-deepBlue font-bold text-xl">
            <div className="bg-deepBlue p-1.5 rounded">
                <Server className="text-white w-4 h-4" />
            </div>
            Aether<span className="text-teal font-light">:</span>Onboarding
         </div>
         <div className="text-sm text-gray-400">Session ID: #AE-9921</div>
      </header>

      <div className="max-w-4xl mx-auto w-full flex-grow p-4 md:p-12 flex flex-col justify-center">
        
        <div className="mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
            <div className="flex justify-between max-w-md mx-auto">
                {[
                    { id: 1, label: "Structural Audit", icon: BrainCircuit },
                    { id: 2, label: "Data Ingestion", icon: Database },
                    { id: 3, label: "Architecture", icon: Server }
                ].map((s) => (
                    <div key={s.id} className={`flex flex-col items-center bg-white px-2 transition-colors duration-300 ${step >= s.id ? 'text-deepBlue' : 'text-gray-300'}`}>
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 ${
                            step === s.id ? 'border-teal bg-teal text-white shadow-lg shadow-teal/30 scale-110' : 
                            step > s.id ? 'border-deepBlue bg-deepBlue text-white' : 'border-gray-200'
                        }`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="relative">
            {step === 1 && (
                <div className="transition-all duration-500 ease-out max-w-3xl mx-auto">
                    {!isProcessing && !isDiscoveryComplete && (
                        <div className="animate-fade-in-up">
                            <label className="block text-2xl md:text-3xl font-light text-deepBlue mb-8 leading-tight">
                                {currentQuestion}
                            </label>
                            
                            <div className="relative group">
                                <textarea 
                                    className="w-full bg-lightGray/20 border-b-2 border-gray-200 p-4 text-lg text-deepBlue focus:outline-none focus:border-teal focus:bg-lightGray/40 transition-all resize-none min-h-[120px] rounded-t-lg placeholder-gray-400"
                                    placeholder="Type your detailed response here..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    autoFocus
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Press Enter ↵</span>
                                    <Button 
                                        onClick={handleSend} 
                                        disabled={!input.trim()} 
                                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isProcessing && <ProcessingState />}

                    {isDiscoveryComplete && (
                        <div className="text-center py-8 animate-fade-in-up">
                            <div className="inline-flex p-4 rounded-full bg-teal/10 text-teal mb-6">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold text-deepBlue mb-4">Audit Complete</h2>
                            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                                The Architect has mapped your operational bottlenecks. We are ready to ingest your raw data to build the scaffold.
                            </p>
                            <Button size="lg" onClick={() => setStep(2)} className="shadow-xl shadow-teal/20">
                                Initialize Data Ingestion <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-deepBlue mb-2">Ingest Source Data</h2>
                        <p className="text-gray-500 max-w-lg mx-auto">Upload your raw CSV files. The system will automatically parse, type-check, and link your data.</p>
                    </div>

                    {/* File List */}
                    <div className="grid gap-6 mb-8">
                        {uploadedFiles.map((file, index) => (
                            <div key={file.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                                <div className="p-4 bg-lightGray/30 flex items-center justify-between border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal/10 p-2 rounded-lg">
                                            <FileText className="text-teal w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-deepBlue text-sm">{file.name}</p>
                                            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB • {file.type || 'CSV'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <label className="block text-xs font-bold text-deepBlue mb-2 uppercase tracking-wider">Contextual Metadata</label>
                                    <textarea 
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal focus:border-teal outline-none resize-none text-sm transition-all"
                                        placeholder="What does this file represent? (e.g. 'Q3 Sales Leads')"
                                        rows={2}
                                        value={file.description}
                                        onChange={(e) => updateFileDescription(file.id, e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Area */}
                    <div className={`bg-white border-2 border-dashed border-gray-200 rounded-2xl transition-all group cursor-pointer relative ${uploadedFiles.length > 0 ? 'p-6 hover:border-teal' : 'p-12 hover:border-teal hover:bg-teal/5'}`}>
                         <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept=".csv" onChange={handleFileUpload} />
                         
                         <div className="flex flex-col items-center justify-center">
                            {uploadedFiles.length > 0 ? (
                                <div className="flex items-center gap-2 text-teal font-semibold">
                                    <Plus className="w-5 h-5" />
                                    <span>Click or Drag to add more files</span>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-lightGray rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud className="w-8 h-8 text-teal" />
                                    </div>
                                    <span className="font-bold text-deepBlue text-lg">Drop CSV files here</span>
                                    <span className="text-sm text-gray-400 mt-2">Automatic Schema Detection Active</span>
                                </>
                            )}
                         </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                        {uploadedFiles.length > 0 && (
                            <Button onClick={() => setStep(3)} size="lg" className="shadow-lg">
                                Process {uploadedFiles.length} File{uploadedFiles.length !== 1 ? 's' : ''} <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col items-center justify-center text-center h-[400px]">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center animate-fade-in-up">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-lightGray rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-teal rounded-full border-t-transparent animate-spin"></div>
                                <Server className="absolute inset-0 m-auto text-deepBlue w-10 h-10 animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-bold text-deepBlue mb-2">Constructing Scaffolding...</h2>
                            <div className="flex flex-col gap-2 text-sm text-gray-400 mt-4 font-mono">
                                <span className="animate-pulse">Ingesting Real Data... [OK]</span>
                                <span className="animate-pulse delay-100">Inferring Data Types (UUID, INT, VARCHAR)... [OK]</span>
                                <span className="animate-pulse delay-200">Detecting Foreign Key Relationships... [OK]</span>
                                <span className="animate-pulse delay-300">Architecting Pipelines... [PROCESSING]</span>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-lg animate-fade-in-up">
                            <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BrainCircuit className="w-10 h-10 text-teal" />
                            </div>
                            <h2 className="text-4xl font-bold text-deepBlue mb-4">Foundation Ready</h2>
                            <p className="text-gray-600 mb-8 text-lg">
                                The Architect has successfully modeled your operational pipelines based on the ingested data. Your custom dashboard is ready for deployment.
                            </p>
                            <Button size="lg" onClick={handleAnalyze} className="w-full shadow-xl shadow-teal/20 py-4 text-lg">
                                Enter Dashboard
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
