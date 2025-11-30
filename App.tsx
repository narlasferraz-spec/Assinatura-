import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Menu, X, Search, Bell, Home, FileText, PenTool, Users, 
  CreditCard, Shield, CheckCircle, ChevronRight, LogOut, 
  Settings, Plus, Upload, Download, Copy, Trash2, Clock, 
  AlertCircle, Eye, Send, Sparkles, FileCheck, Lock, MoreVertical,
  MapPin, Calendar, Eraser, Undo, Mail, XCircle, MousePointer2, Move, Type,
  User as UserIcon
} from 'lucide-react';
import { User, Contract, Plan, Signer, ContractField } from './types';
import { MOCK_USER, MOCK_CONTRACTS, PLANS, PIX_KEY } from './constants';
import { generateLegalDraft } from './services/geminiService';

// --- COMPONENTS ---

const Button = ({ children, variant = 'primary', className = '', onClick, disabled, type = 'button', icon: Icon }: any) => {
  const baseStyle = "px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
    ghost: "text-gray-600 hover:bg-gray-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
  };
  return (
    <button 
      type={type}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'blue' }: any) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${colors[color as keyof typeof colors]}`}>
      {children}
    </span>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-gray-900 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${bgColors[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up max-w-sm`}>
      {type === 'success' && <CheckCircle size={20} className="text-green-400" />}
      {type === 'info' && <Mail size={20} className="text-blue-200" />}
      {type === 'error' && <AlertCircle size={20} className="text-red-200" />}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
    </div>
  );
};

// --- SUB-VIEWS & FEATURES ---

const App = () => {
  // Navigation & Auth
  const [view, setView] = useState<'landing' | 'dashboard' | 'editor' | 'signing' | 'plans' | 'support'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor State
  const [editorMode, setEditorMode] = useState<'text' | 'pdf'>('text');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorLocation, setEditorLocation] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [editorSignerEmail, setEditorSignerEmail] = useState('');
  const [contractFields, setContractFields] = useState<ContractField[]>([]);
  
  // Smart Fields State
  const [isPlacingField, setIsPlacingField] = useState(false);
  const [placingType, setPlacingType] = useState<ContractField['type'] | null>(null);

  const [emailError, setEmailError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Modals & UI Feedback
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Derived
  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: contracts.length,
    signed: contracts.filter(c => c.status === 'completed').length,
    pending: contracts.filter(c => c.status === 'pending').length,
  };

  // --- ACTIONS ---

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = (isDemo = false) => {
    if (isDemo) {
      setUser(MOCK_USER);
      setView('dashboard');
    } else {
      setShowAuthModal(true);
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
  };

  const handleAiDraft = async (topic: string) => {
    if (editorMode === 'pdf') {
        alert("A IA só pode gerar texto para contratos em modo de edição de texto, não para PDFs prontos.");
        return;
    }
    setIsAiGenerating(true);
    const text = await generateLegalDraft(topic, 'clause');
    setEditorContent(prev => prev + (prev ? '\n\n' : '') + text);
    setIsAiGenerating(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, envie apenas arquivos PDF.');
        return;
      }
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfPreviewUrl(url);
      setEditorTitle(file.name.replace('.pdf', ''));
      setEditorMode('pdf');
      setContractFields([]);
      if (titleError) setTitleError('');
    }
  };

  const startFieldPlacement = (type: ContractField['type']) => {
    setIsPlacingField(true);
    setPlacingType(type);
    showToast("Clique no documento para posicionar o campo", "info");
  };

  const handlePdfContainerClick = (e: React.MouseEvent) => {
    if (!isPlacingField || !placingType || !pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newField: ContractField = {
      id: Math.random().toString(36).substr(2, 9),
      type: placingType,
      label: placingType === 'date' ? 'Data' : placingType === 'signer_name' ? 'Nome' : placingType === 'signature' ? 'Assinatura' : 'Texto',
      x,
      y
    };

    setContractFields([...contractFields, newField]);
    setIsPlacingField(false);
    setPlacingType(null);
    showToast("Campo adicionado com sucesso!", "success");
  };

  const removeField = (id: string) => {
    setContractFields(contractFields.filter(f => f.id !== id));
  };

  const clearEditor = () => {
    setEditorTitle('');
    setEditorLocation('');
    setEditorContent('');
    setEditorSignerEmail('');
    setEmailError('');
    setTitleError('');
    setPdfFile(null);
    setPdfPreviewUrl(null);
    setEditorMode('text');
    setContractFields([]);
    setIsPlacingField(false);
  };

  const createContract = () => {
    let isValid = true;
    setEmailError('');
    setTitleError('');

    // Validação do Título
    if (!editorTitle.trim()) {
      setTitleError('O título do contrato é obrigatório.');
      isValid = false;
    }

    // Validação do Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editorSignerEmail || !emailRegex.test(editorSignerEmail)) {
      setEmailError('Por favor, insira um e-mail válido (ex: nome@empresa.com).');
      isValid = false;
    }

    // Validação de Conteúdo (Texto ou PDF)
    if (editorMode === 'text' && !editorContent.trim()) {
       isValid = false;
    }
    if (editorMode === 'pdf' && !pdfFile) {
       isValid = false;
    }

    if (!isValid) return;

    const newContract: Contract = {
      id: Math.random().toString(36).substr(2, 9),
      title: editorTitle,
      location: editorLocation || 'São Paulo, SP',
      content: editorMode === 'text' ? editorContent : 'Documento PDF Anexado',
      type: editorMode,
      fileUrl: editorMode === 'pdf' && pdfPreviewUrl ? pdfPreviewUrl : undefined,
      status: 'pending',
      createdBy: user?.id || 'u1',
      createdAt: new Date(),
      hash: Math.random().toString(36).substr(2, 32), // Mock hash
      fields: contractFields,
      signers: [
        { 
          id: user?.id || 'u1', 
          name: user?.name || 'Me', 
          email: user?.email || '', 
          role: 'sender', 
          status: 'signed', 
          signedAt: new Date() 
        },
        { 
          id: 'temp-' + Math.random(), 
          name: editorSignerEmail.split('@')[0], 
          email: editorSignerEmail, 
          role: 'signer', 
          status: 'pending' 
        }
      ]
    };

    setContracts([newContract, ...contracts]);
    showToast(`Contrato enviado para ${editorSignerEmail}`, 'success');
    
    // Simulate email dispatch
    setTimeout(() => {
      showToast(`E-mail de notificação entregue para ${editorSignerEmail}`, 'info');
    }, 2000);

    clearEditor();
    setView('dashboard');
  };

  const openSigningRoom = (contract: Contract) => {
    setActiveContract(contract);
    setView('signing');
  };

  const simulateEmailDispatch = (contract: Contract, type: 'signed' | 'rejected') => {
     const recipients = contract.signers.map(s => s.email).join(', ');
     const subject = type === 'signed' 
        ? `Todos assinaram: ${contract.title}` 
        : `Contrato REJEITADO: ${contract.title}`;
     
     console.log(`[SMTP SIMULATION] To: ${recipients} | Subject: ${subject}`);
     
     setTimeout(() => {
       showToast(
         type === 'signed' 
          ? `Notificação de conclusão enviada por e-mail para todos os participantes.`
          : `Alerta de rejeição enviado por e-mail ao contratante.`,
         'info'
       );
     }, 1500);
  };

  const signDocument = (signatureDataUrl: string) => {
    if (!activeContract || !user) return;
    
    let isFullySigned = false;

    const updatedContracts = contracts.map(c => {
      if (c.id === activeContract.id) {
        const updatedSigners = c.signers.map(s => {
          if (s.status === 'pending') { 
             return { 
               ...s, 
               status: 'signed' as const, 
               signedAt: new Date(),
               signatureImage: signatureDataUrl
             };
          }
          return s;
        });
        
        const allSigned = updatedSigners.every(s => s.status === 'signed');
        if (allSigned) isFullySigned = true;

        const updatedContract = { 
          ...c, 
          signers: updatedSigners,
          status: allSigned ? 'completed' : 'pending' 
        } as Contract;
        
        setActiveContract(updatedContract);
        return updatedContract;
      }
      return c;
    });

    setContracts(updatedContracts);
    setShowSignatureModal(false);
    
    if (isFullySigned && activeContract) {
       simulateEmailDispatch(activeContract, 'signed');
    } else {
       showToast("Assinatura registrada com sucesso!");
    }
  };

  const rejectDocument = () => {
    if (!activeContract || !user) return;
    
    const confirmReject = window.confirm("Tem certeza que deseja rejeitar este contrato? Esta ação notificará o remetente e não poderá ser desfeita.");
    if (!confirmReject) return;

    const updatedContracts = contracts.map(c => {
      if (c.id === activeContract.id) {
        const updatedSigners = c.signers.map(s => {
          if (s.status === 'pending') { 
             return { ...s, status: 'rejected' as const };
          }
          return s;
        });

        // We cast to any here just to satisfy the strict typing of status for this demo flow
        const updatedContract = { 
          ...c, 
          signers: updatedSigners,
          status: 'archived' // Set as archived or a specific 'rejected' status if type allowed
        } as any;
        
        setActiveContract(updatedContract);
        return updatedContract;
      }
      return c;
    });

    setContracts(updatedContracts);
    simulateEmailDispatch(activeContract, 'rejected');
  };

  // --- VIEWS ---

  const LandingView = () => (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8 flex justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
                A maneira mais segura de fechar negócios. <a href="#" className="font-semibold text-primary-600"><span className="absolute inset-0" aria-hidden="true"></span>Conheça os planos <span aria-hidden="true">&rarr;</span></a>
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl font-display">
              Assinaturas digitais com <span className="text-primary-600">validade jurídica.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              NeoSign simplifica o fluxo de contratos. Crie, envie e assine documentos em minutos, não dias. Certificação digital inclusa.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button onClick={() => handleLogin(true)} className="h-14 px-8 text-lg rounded-xl">
                Começar Grátis
              </Button>
              <Button variant="ghost" onClick={() => setView('plans')} className="text-lg">
                Ver Preços <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-16 items-center">
             <div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Segurança em primeiro lugar.</h2>
                <p className="mt-4 text-gray-400">Garantimos a integridade de cada documento com hash criptográfico e registro de IP.</p>
                <ul className="mt-8 space-y-4 text-gray-300">
                  <li className="flex gap-3"><Shield className="text-primary-500" /> Criptografia de ponta a ponta</li>
                  <li className="flex gap-3"><FileCheck className="text-primary-500" /> Validade jurídica conforme MP 2.200-2</li>
                  <li className="flex gap-3"><Clock className="text-primary-500" /> Histórico de auditoria completo</li>
                </ul>
             </div>
             <div className="bg-white/5 p-2 rounded-2xl ring-1 ring-white/10">
                <div className="bg-secondary-900 rounded-xl overflow-hidden shadow-2xl">
                   <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                   </div>
                   <div className="p-8 font-mono text-sm text-gray-400">
                      <p className="text-primary-400"> Generating certificate...</p>
                      <p>> Hash: 8f434346648f6b96df89dda901c5176b</p>
                      <p>> Timestamp: {new Date().toISOString()}</p>
                      <p>> Status: <span className="text-green-400">VERIFIED</span></p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Olá, {user?.name}</h2>
          <p className="text-gray-500">Gerencie seus contratos e assinaturas.</p>
        </div>
        <Button onClick={() => { clearEditor(); setView('editor'); }}>
          <Plus size={20} /> Novo Contrato
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Enviado</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Send size={20} /></div>
        </Card>
        <Card className="p-5 border-l-4 border-l-yellow-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendentes</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600"><Clock size={20} /></div>
        </Card>
        <Card className="p-5 border-l-4 border-l-green-500 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assinados</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.signed}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircle size={20} /></div>
        </Card>
      </div>

      {/* List */}
      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="secondary" icon={Settings}>Filtros</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="p-4">Documento</th>
              <th className="p-4 hidden sm:table-cell">Status</th>
              <th className="p-4 hidden md:table-cell">Última Atualização</th>
              <th className="p-4 hidden sm:table-cell">Participantes</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredContracts.map(contract => (
              <tr key={contract.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => openSigningRoom(contract)}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 text-primary-600 p-2 rounded-lg">
                      {contract.type === 'pdf' ? <FileText size={20} /> : <PenTool size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contract.title}</p>
                      <p className="text-xs text-gray-500 sm:hidden mt-1">
                        {contract.status === 'completed' ? 'Assinado' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4 hidden sm:table-cell">
                   <Badge color={contract.status === 'completed' ? 'green' : contract.status === 'pending' ? 'yellow' : 'gray'}>
                     {contract.status === 'completed' ? 'Assinado' : contract.status === 'pending' ? 'Pendente' : 'Arquivado'}
                   </Badge>
                </td>
                <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                  {contract.createdAt.toLocaleDateString()}
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <div className="flex -space-x-2">
                    {contract.signers.map(s => (
                       <div key={s.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${s.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`} title={`${s.name} (${s.status})`}>
                          {s.status === 'rejected' ? <X size={14}/> : s.name[0]}
                       </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredContracts.length === 0 && (
          <div className="p-12 text-center text-gray-400">
             <FileText size={48} className="mx-auto mb-3 opacity-20" />
             <p>Nenhum contrato encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );

  const EditorView = () => (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setView('dashboard')} className="px-2"><X size={24}/></Button>
          <h2 className="text-2xl font-bold">Novo Documento</h2>
          <Badge color={editorMode === 'pdf' ? 'purple' : 'blue'}>
            {editorMode === 'pdf' ? 'Modo PDF' : 'Editor de Texto'}
          </Badge>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="application/pdf" 
            onChange={handleFileUpload}
          />
          <Button 
            variant="secondary" 
            className="hidden sm:flex" 
            icon={Upload} 
            onClick={() => fileInputRef.current?.click()}
          >
            Upload PDF
          </Button>
          <Button 
            onClick={createContract} 
            disabled={editorMode === 'text' ? !editorContent : !pdfFile} 
            icon={Send}
          >
            Enviar para Assinatura
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Main Editor */}
        <div className={`md:col-span-2 flex flex-col gap-4 ${editorMode === 'pdf' ? 'h-full overflow-hidden' : 'overflow-y-auto pr-2 pb-20'}`}>
          <div>
            <input 
              type="text" 
              placeholder="Título do Contrato (ex: Contrato de Aluguel)"
              className={`w-full text-2xl font-bold border-none outline-none bg-transparent ${titleError ? 'placeholder-red-300' : 'placeholder:text-gray-300'}`}
              value={editorTitle}
              onChange={(e) => {
                setEditorTitle(e.target.value);
                if(titleError) setTitleError('');
              }}
            />
            {titleError && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-500 animate-pulse">
                <AlertCircle size={14} />
                <span>{titleError}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3 text-gray-500">
               <MapPin size={16} />
               <input 
                  type="text" 
                  placeholder="Local da assinatura (ex: São Paulo, SP)"
                  className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none text-sm w-64 transition-colors"
                  value={editorLocation}
                  onChange={(e) => setEditorLocation(e.target.value)}
               />
            </div>
          </div>
          
          <div className={`flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative ${editorMode === 'pdf' ? 'h-full' : 'min-h-[500px]'}`}>
             {editorMode === 'text' ? (
                <textarea 
                  className="w-full h-full p-6 resize-none border-none outline-none font-serif text-lg leading-relaxed text-gray-800"
                  placeholder="Digite os termos do contrato ou use a IA para ajudar..."
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                />
             ) : (
                <div className="w-full h-full bg-gray-100 flex flex-col relative" ref={pdfContainerRef}>
                  {pdfPreviewUrl ? (
                    <>
                      <div className="bg-gray-800 text-white px-4 py-2 text-sm flex justify-between items-center shrink-0 z-10">
                        <span className="truncate flex-1">{pdfFile?.name}</span>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 hidden sm:inline-block">
                                 {isPlacingField ? 'Modo de Posicionamento' : 'Role para ver tudo'}
                              </span>
                              <button 
                                onClick={() => {
                                   setIsPlacingField(!isPlacingField);
                                   setPlacingType(null);
                                }} 
                                className={`text-xs px-2 py-1 rounded transition-colors ${isPlacingField ? 'bg-primary-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                              >
                                {isPlacingField ? 'Destravar Rolagem' : 'Travar e Posicionar'}
                              </button>
                           </div>
                           <button onClick={clearEditor} className="hover:text-red-300 font-medium ml-2">Remover</button>
                        </div>
                      </div>
                      
                      {/* PDF Container Area */}
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Overlay for Field Placement */}
                        {(isPlacingField || contractFields.length > 0) && (
                           <div 
                              className={`absolute inset-0 z-20 ${isPlacingField ? 'cursor-crosshair bg-black/5' : 'pointer-events-none'}`}
                              onClick={handlePdfContainerClick}
                           >
                              {contractFields.map(field => (
                                 <div 
                                    key={field.id}
                                    className="absolute bg-white/90 shadow-md border-2 border-primary-500 text-primary-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 group hover:z-30"
                                    style={{ left: `${field.x}%`, top: `${field.y}%` }}
                                 >
                                    {field.type === 'date' && <Calendar size={12}/>}
                                    {field.type === 'signature' && <PenTool size={12}/>}
                                    {field.type === 'signer_name' && <UserIcon size={12}/>}
                                    {field.type === 'text' && <Type size={12}/>}
                                    {field.label}
                                    {isPlacingField && (
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); removeField(field.id); }} 
                                          className="text-red-400 hover:text-red-600 ml-1"
                                       >
                                          <X size={12} />
                                       </button>
                                    )}
                                 </div>
                              ))}
                              
                              {isPlacingField && placingType && (
                                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-xs shadow-xl pointer-events-none animate-bounce">
                                    Clique no local para adicionar o campo: <strong>{placingType}</strong>
                                 </div>
                              )}
                           </div>
                        )}

                        <iframe 
                          src={pdfPreviewUrl} 
                          className="w-full h-full block" 
                          title="PDF Preview"
                          width="100%"
                          height="100%"
                          style={{ pointerEvents: isPlacingField ? 'none' : 'auto' }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <FileText size={48} className="mb-2" />
                      <p>Erro ao carregar prévia</p>
                    </div>
                  )}
                </div>
             )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 overflow-y-auto">
          {/* AI Assistant (Text Mode) */}
          {editorMode === 'text' && (
             <Card className="p-5">
               <h3 className="font-bold text-sm uppercase text-gray-500 mb-4 flex items-center gap-2">
                 <Sparkles size={16} className="text-primary-500"/> Assistente IA
               </h3>
               <div className="space-y-3">
                 <p className="text-sm text-gray-600">O que você precisa escrever?</p>
                 <div className="flex flex-wrap gap-2">
                   {['Cláusula de Rescisão', 'Multa por Atraso', 'Confidencialidade', 'Objeto do Contrato'].map(topic => (
                     <button 
                      key={topic}
                      onClick={() => handleAiDraft(topic)}
                      className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full transition-colors"
                     >
                       + {topic}
                     </button>
                   ))}
                 </div>
                 {isAiGenerating && <p className="text-xs text-primary-600 animate-pulse">Gerando texto jurídico...</p>}
               </div>
             </Card>
          )}

          {/* Smart Fields (PDF Mode) */}
          {editorMode === 'pdf' && (
            <Card className="p-5 border-primary-100 ring-4 ring-primary-50">
               <h3 className="font-bold text-sm uppercase text-primary-600 mb-4 flex items-center gap-2">
                 <MousePointer2 size={16}/> Campos Inteligentes
               </h3>
               <p className="text-xs text-gray-500 mb-3">
                  Trave a rolagem do PDF e adicione campos para preenchimento automático.
               </p>
               <div className="grid grid-cols-2 gap-2">
                  <button 
                     onClick={() => startFieldPlacement('date')}
                     className={`flex items-center gap-2 p-2 rounded text-xs border transition-all ${placingType === 'date' ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                  >
                     <Calendar size={14} className="text-blue-500"/> Data
                  </button>
                  <button 
                     onClick={() => startFieldPlacement('signer_name')}
                     className={`flex items-center gap-2 p-2 rounded text-xs border transition-all ${placingType === 'signer_name' ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                  >
                     <Users size={14} className="text-green-500"/> Nome
                  </button>
                  <button 
                     onClick={() => startFieldPlacement('signature')}
                     className={`flex items-center gap-2 p-2 rounded text-xs border transition-all ${placingType === 'signature' ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                  >
                     <PenTool size={14} className="text-purple-500"/> Assinatura
                  </button>
                  <button 
                     onClick={() => startFieldPlacement('text')}
                     className={`flex items-center gap-2 p-2 rounded text-xs border transition-all ${placingType === 'text' ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                  >
                     <Type size={14} className="text-gray-500"/> Texto Livre
                  </button>
               </div>
               {contractFields.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                     <p className="text-xs font-medium text-gray-500 mb-2">{contractFields.length} campos posicionados</p>
                     <button onClick={() => setContractFields([])} className="text-xs text-red-500 hover:text-red-700 underline">Limpar tudo</button>
                  </div>
               )}
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-bold text-sm uppercase text-gray-500 mb-4 flex items-center gap-2">
              <Users size={16} /> Participantes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Parte 1 (Você)</label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-primary-600 rounded-full text-white flex items-center justify-center text-xs">Me</div>
                  <span className="text-sm">{user?.email}</span>
                </div>
              </div>
              <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">Parte 2 (Destinatário)</label>
                 <input 
                    type="email" 
                    placeholder="E-mail do assinante"
                    className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${emailError ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-300' : 'border-gray-300'}`}
                    value={editorSignerEmail}
                    onChange={(e) => {
                      setEditorSignerEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                 />
                 {emailError && (
                   <div className="flex items-center gap-1 mt-1 text-xs text-red-500 animate-pulse">
                     <AlertCircle size={12} />
                     <span>{emailError}</span>
                   </div>
                 )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const SigningRoomView = () => {
    if (!activeContract) return null;
    const isCompleted = activeContract.status === 'completed';
    const isRejected = (activeContract as any).status === 'archived' || (activeContract as any).status === 'rejected';
    const pendingSigner = activeContract.signers.find(s => s.status === 'pending');
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setView('dashboard')}>
            <ChevronRight size={20} className="rotate-180" /> Voltar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download}>Baixar PDF</Button>
            {!isCompleted && !isRejected && pendingSigner && (
              <>
                <Button 
                  variant="danger" 
                  onClick={rejectDocument} 
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-none"
                >
                  Rejeitar
                </Button>
                <Button onClick={() => setShowSignatureModal(true)} icon={PenTool}>Assinar Agora</Button>
              </>
            )}
            {isRejected && (
              <Badge color="red">Contrato Rejeitado</Badge>
            )}
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-none min-h-[800px] p-12 relative paper-pattern">
           <div className="mb-12 text-center border-b pb-8">
             <h1 className="text-3xl font-bold text-gray-900 font-display uppercase tracking-wider mb-2">{activeContract.title}</h1>
             <p className="text-gray-500 mb-4">ID: {activeContract.id} • Criado em: {activeContract.createdAt.toLocaleDateString()}</p>
             
             <div className="flex justify-center items-center gap-6 mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <MapPin size={16} className="text-primary-500"/>
                  <span className="text-sm font-medium">{activeContract.location || 'São Paulo, SP'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                  <Calendar size={16} className="text-primary-500"/>
                  <span className="text-sm font-medium">
                    {activeContract.status === 'completed' 
                      ? `Assinado em ${activeContract.createdAt.toLocaleDateString()}` 
                      : `Aguardando Assinatura`}
                  </span>
                </div>
             </div>
           </div>

           <div className="prose max-w-none text-justify font-serif text-gray-800 leading-8 whitespace-pre-line mb-16 relative">
             {activeContract.type === 'pdf' && activeContract.fileUrl ? (
                <>
                   {/* Overlay Fields in Signing Room */}
                   {activeContract.fields && activeContract.fields.length > 0 && (
                      <div className="absolute inset-0 z-10 pointer-events-none">
                         {activeContract.fields.map(field => (
                            <div 
                               key={field.id}
                               className={`absolute px-3 py-1.5 rounded text-xs font-bold border-2 transform -translate-x-1/2 -translate-y-1/2 shadow-sm ${isCompleted ? 'bg-white/80 border-gray-900 text-gray-900' : 'bg-yellow-100/90 border-yellow-500 text-yellow-800'}`}
                               style={{ left: `${field.x}%`, top: `${field.y}%` }}
                            >
                               {field.label}: 
                               <span className="ml-1 font-normal font-mono">
                                  {field.type === 'date' ? new Date().toLocaleDateString() : 
                                   field.type === 'signer_name' ? user?.name || '...' : 
                                   field.type === 'signature' ? (isCompleted ? 'Assinado Digitalmente' : '[Pendente]') : '...'}
                               </span>
                            </div>
                         ))}
                      </div>
                   )}
                   <iframe src={activeContract.fileUrl} className="w-full h-[800px] border-none" />
                </>
             ) : (
                activeContract.content
             )}
           </div>

           {/* Signatures Area */}
           <div className="grid grid-cols-2 gap-12 pt-12 border-t border-gray-200">
             {activeContract.signers.map(signer => (
               <div key={signer.id} className="relative">
                  {signer.status === 'signed' ? (
                    <div className="border-b-2 border-gray-900 pb-2 mb-2">
                      {signer.signatureImage ? (
                        <img src={signer.signatureImage} alt="Assinatura" className="h-16 object-contain" />
                      ) : (
                        <div className="font-handwriting text-2xl md:text-4xl text-blue-900 font-bold transform -rotate-2">
                           {signer.name}
                        </div>
                      )}
                    </div>
                  ) : signer.status === 'rejected' ? (
                    <div className="border-b-2 border-red-300 pb-2 mb-2 flex items-center justify-center h-16 bg-red-50 text-red-500 font-bold">
                       RECUSADO
                    </div>
                  ) : (
                    <div className="border-b-2 border-gray-300 border-dashed pb-12 mb-2"></div>
                  )}
                  <p className="font-bold text-sm uppercase">{signer.role === 'sender' ? 'Contratante' : 'Contratado'}</p>
                  <p className="text-sm text-gray-500">{signer.name}</p>
                  <p className="text-xs text-gray-400">{signer.email}</p>
                  
                  {signer.status === 'signed' && (
                     <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100 text-left">
                       <div className="flex items-center gap-1 mb-2 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs font-bold uppercase">Assinatura Digital</span>
                       </div>
                       <div className="font-mono text-[10px] text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Data:</span>
                            <span className="font-semibold">{signer.signedAt?.toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Hora:</span>
                            <span className="font-semibold">{signer.signedAt?.toLocaleTimeString()}</span>
                          </div>
                          <div className="border-t border-gray-200 my-1 pt-1">
                            <span className="block mb-0.5">Hash do Documento:</span>
                            <span className="break-all bg-white p-1 rounded border border-gray-100 block">
                              {activeContract.hash}
                            </span>
                          </div>
                       </div>
                     </div>
                  )}
               </div>
             ))}
           </div>

           {/* Digital Certificate Footer */}
           {isCompleted && (
             <div className="mt-20 p-6 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-6">
                <div className="w-20 h-20 bg-white p-2 rounded border border-gray-200 flex items-center justify-center">
                  <Shield size={40} className="text-gray-800" />
                </div>
                <div className="flex-1 font-mono text-xs text-gray-500 space-y-1">
                  <p className="font-bold text-gray-800 text-sm mb-2 uppercase">Certificado de Autenticidade Digital NeoSign</p>
                  <p>Hash do Documento: {activeContract.hash}</p>
                  <p>Carimbo de Tempo: {new Date().toISOString()}</p>
                  <p>Validade: MP 2.200-2/2001 - ICP-Brasil</p>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  const PlansView = () => (
    <div className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
         <h2 className="text-3xl font-bold mb-4">Planos Flexíveis</h2>
         <p className="text-gray-500 mb-12">Escolha o plano ideal para o seu volume de contratos.</p>
         
         <div className="grid md:grid-cols-3 gap-8">
           {PLANS.map((plan) => (
             <Card key={plan.id} className={`p-8 relative transition-all hover:shadow-xl ${plan.recommended ? 'border-primary-500 ring-2 ring-primary-200 scale-105' : ''}`}>
               {plan.recommended && (
                 <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                   Mais Escolhido
                 </div>
               )}
               <h3 className="text-xl font-bold mb-2 text-gray-800">{plan.name}</h3>
               <div className="flex items-end justify-center gap-1 mb-6">
                 <span className="text-4xl font-bold text-gray-900">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                 <span className="text-gray-500 mb-1">{plan.period}</span>
               </div>
               <ul className="text-left space-y-4 mb-8">
                 {plan.features.map((feat, idx) => (
                   <li key={idx} className="flex items-start gap-3 text-gray-600 text-sm">
                     <CheckCircle size={18} className="text-primary-500 flex-shrink-0 mt-0.5" />
                     <span>{feat}</span>
                   </li>
                 ))}
               </ul>
               <Button 
                 variant={plan.recommended ? 'primary' : 'outline'} 
                 className="w-full"
                 onClick={() => { setSelectedPlan(plan); setShowPaymentModal(true); }}
               >
                 Assinar Agora
               </Button>
             </Card>
           ))}
         </div>
      </div>
    </div>
  );

  // --- MODALS ---

  const SignatureModal = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#2563eb';
        }
      }
    }, [showSignatureModal]);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent | any) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const startDrawing = (event: any) => {
      const { x, y } = getCoordinates(event);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && canvasRef.current) {
         // Save state before drawing new stroke? 
         // Strategy: We push to history AFTER the stroke is done.
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      }
    };

    const draw = (event: any) => {
      if (!isDrawing) return;
      const { x, y } = getCoordinates(event);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
      }
    };

    const stopDrawing = () => {
      if (isDrawing && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.closePath();
          // Save state to history
          const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
          setHistory(prev => [...prev, imageData]);
        }
        setIsDrawing(false);
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        setHistory([]);
      }
    };

    const handleUndo = () => {
      if (history.length === 0) return;
      
      const newHistory = [...history];
      newHistory.pop(); // Remove current state (last stroke)
      setHistory(newHistory);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         if (newHistory.length > 0) {
            ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
            setHasDrawn(true);
         } else {
            setHasDrawn(false);
         }
      }
    };

    const handleConfirm = () => {
      if (canvasRef.current && hasDrawn) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        signDocument(dataUrl);
      }
    };

    if (!showSignatureModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 backdrop-blur-sm p-4 animate-fade-in">
        <Card className="w-full max-w-lg p-0 overflow-hidden">
          <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Desenhe sua Assinatura</h3>
            <button onClick={() => setShowSignatureModal(false)}><X size={20} className="text-gray-400"/></button>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="bg-white border border-gray-300 rounded-xl shadow-inner mb-4 overflow-hidden touch-none relative">
              <canvas
                ref={canvasRef}
                className="w-full h-48 cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 select-none">
                    Assine aqui
                 </div>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                 <button 
                  onClick={clearCanvas} 
                  className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                 >
                   <Eraser size={16} /> Limpar
                 </button>
                 <button 
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="text-sm text-gray-500 hover:text-blue-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Undo size={16} /> Desfazer
                 </button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowSignatureModal(false)}>Cancelar</Button>
                <Button onClick={handleConfirm} disabled={!hasDrawn}>Confirmar</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const PaymentModal = () => {
    if (!showPaymentModal || !selectedPlan) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 backdrop-blur-sm p-4">
        <Card className="w-full max-w-lg p-0 overflow-hidden">
          <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-gray-900">Checkout NeoSign Premium</h3>
             <button onClick={() => setShowPaymentModal(false)}><X size={20} className="text-gray-400"/></button>
          </div>
          <div className="p-6">
            <div className="bg-primary-50 p-4 rounded-xl mb-6 flex justify-between items-center">
               <div>
                 <p className="font-bold text-primary-900">Plano {selectedPlan.name}</p>
                 <p className="text-xs text-primary-700">{selectedPlan.period}</p>
               </div>
               <span className="text-xl font-bold text-primary-700">R$ {selectedPlan.price.toFixed(2)}</span>
            </div>

            <div className="space-y-4 mb-6">
               <label className="flex items-center gap-4 border p-4 rounded-xl cursor-pointer bg-blue-50/50 border-blue-200 ring-1 ring-blue-200">
                  <div className="w-5 h-5 rounded-full border-4 border-blue-600"></div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">PIX (Instantâneo)</span>
                    <span className="text-xs text-gray-500">Liberação imediata</span>
                  </div>
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded border">PIX</span>
               </label>
               
               <div className="pl-9 pr-4 pb-2">
                 <p className="text-xs text-gray-500 mb-2">Copie a chave abaixo:</p>
                 <div className="flex gap-2">
                    <code className="flex-1 bg-gray-100 p-2 rounded text-xs">{PIX_KEY}</code>
                    <Button variant="outline" className="h-8 px-2 py-0 text-xs" onClick={() => navigator.clipboard.writeText(PIX_KEY)}><Copy size={14}/></Button>
                 </div>
               </div>

               <label className="flex items-center gap-4 border p-4 rounded-xl cursor-not-allowed opacity-60">
                  <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                  <div className="flex-1">
                    <span className="font-bold text-sm block">Cartão de Crédito</span>
                  </div>
                  <CreditCard size={18} className="text-gray-400"/>
               </label>
            </div>

            <Button className="w-full py-3" onClick={() => { setShowPaymentModal(false); showToast("Pagamento processado com sucesso!", "success"); }}>
               Confirmar Pagamento
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const AuthModal = () => {
      if (!showAuthModal) return null;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md p-8 relative">
             <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
             <div className="text-center mb-8">
               <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-primary-500/30">
                 <PenTool size={24} />
               </div>
               <h2 className="text-2xl font-bold">Entrar no NeoSign</h2>
               <p className="text-gray-500 text-sm mt-2">Acesse seus documentos seguros</p>
             </div>
             <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(true); setShowAuthModal(false); }}>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                   <input type="email" placeholder="nome@empresa.com" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                   <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <Button className="w-full py-3 mt-4" type="submit">Acessar Painel</Button>
             </form>
             <div className="mt-6 text-center text-xs text-gray-400">
               Protegido por reCAPTCHA e sujeito aos Termos de Uso.
             </div>
          </Card>
        </div>
      );
  }

  // --- LAYOUT ---

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-gray-50">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
             <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                <PenTool size={18} />
             </div>
             <span className="font-bold text-xl font-display tracking-tight text-gray-900">NeoSign</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('landing')} className="text-sm font-medium text-gray-600 hover:text-primary-600">Início</button>
            <button onClick={() => setView('plans')} className="text-sm font-medium text-gray-600 hover:text-primary-600">Planos</button>
            <button onClick={() => setView('support')} className="text-sm font-medium text-gray-600 hover:text-primary-600">Suporte</button>
            
            <div className="h-6 w-px bg-gray-200"></div>

            {user ? (
               <div className="flex items-center gap-4">
                 <button onClick={() => setView('dashboard')} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <img src={user.avatar} className="w-8 h-8 rounded-full border border-gray-200" alt="" />
                    <span className="text-sm font-medium">{user.name}</span>
                 </button>
                 <Button variant="danger" className="h-9 px-3" onClick={handleLogout}><LogOut size={16}/></Button>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                 <button onClick={() => handleLogin(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">Entrar</button>
                 <Button onClick={() => handleLogin(false)} className="h-10 px-5 rounded-full">Criar Conta</Button>
               </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-4 absolute w-full shadow-xl">
             <div className="flex flex-col gap-4">
                <button onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}>Painel</button>
                <button onClick={() => { setView('plans'); setMobileMenuOpen(false); }}>Planos</button>
                <Button onClick={() => handleLogin(false)}>Acessar Conta</Button>
             </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {view === 'landing' && <LandingView />}
        {view === 'dashboard' && <DashboardView />}
        {view === 'editor' && <EditorView />}
        {view === 'signing' && <SigningRoomView />}
        {view === 'plans' && <PlansView />}
        {view === 'support' && (
          <div className="max-w-2xl mx-auto py-20 px-4 text-center">
             <h2 className="text-3xl font-bold mb-4">Como podemos ajudar?</h2>
             <p className="text-gray-500 mb-8">Nossa equipe de suporte jurídico e técnico está disponível 24/7.</p>
             <Card className="p-8 text-left space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:border-primary-500 cursor-pointer transition-colors group">
                   <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-100"><FileText size={24}/></div>
                   <div>
                     <h4 className="font-bold">Dúvidas sobre validade jurídica</h4>
                     <p className="text-sm text-gray-500">Saiba mais sobre a MP 2.200-2</p>
                   </div>
                   <ChevronRight className="ml-auto text-gray-400"/>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:border-primary-500 cursor-pointer transition-colors group">
                   <div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:bg-purple-100"><Settings size={24}/></div>
                   <div>
                     <h4 className="font-bold">Problemas Técnicos</h4>
                     <p className="text-sm text-gray-500">Dificuldades com a assinatura?</p>
                   </div>
                   <ChevronRight className="ml-auto text-gray-400"/>
                </div>
             </Card>
          </div>
        )}
      </main>

      <PaymentModal />
      <AuthModal />
      <SignatureModal />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
    </div>
  );
};

export default App;