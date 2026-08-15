import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClaudeChatInput from '../components/ui/claude-style-chat-input';

const ChatboxDemo = () => {
    const [messages, setMessages] = useState<string[]>([]);

    const handleSendMessage = (data: { message: string; files: any[]; pastedContent: any[]; model: string }) => {
        console.log('Sending message:', data.message);
        console.log('Attached files:', data.files);
        setMessages(prev => [...prev, data.message]);
    };

    const currentHour = new Date().getHours();
    let greeting = 'Günaydın';
    if (currentHour >= 12 && currentHour < 18) {
        greeting = 'İyi günler';
    } else if (currentHour >= 18) {
        greeting = 'İyi akşamlar';
    }

    const userName = localStorage.getItem("mini_ai_user_name") || 'Kullanıcı';

    return (
        <div className="min-h-screen w-full bg-[#fcfcf9] dark:bg-[#202123] flex flex-col items-center justify-center p-4 font-sans text-text-100 transition-colors duration-200">
            <div className="absolute top-4 left-4">
                <Button variant="outline" size="sm" asChild className="rounded-xl border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80">
                    <Link to="/"><ArrowLeft className="w-4 h-4 mr-1.5" /> Mini AI'ye Dön</Link>
                </Button>
            </div>

            {/* Greeting Section */}
            <div className="w-full max-w-3xl mb-8 sm:mb-12 text-center animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-3xl">✨</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-light text-text-200 mb-3 tracking-tight">
                    {greeting}, <span className="relative inline-block pb-2">
                        {userName}
                        <svg
                            className="absolute w-[140%] h-[20px] -bottom-1 -left-[5%] text-[#D97757]"
                            viewBox="0 0 140 24"
                            fill="none"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M6 16 Q 70 24, 134 14"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </span>
                </h1>
            </div>

            <ClaudeChatInput onSendMessage={handleSendMessage} />

            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto px-4">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-300 bg-transparent border border-bg-300 dark:border-bg-300/50 rounded-full hover:bg-bg-200 hover:text-text-200 transition-colors duration-150">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Kod Yaz
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-300 bg-transparent border border-bg-300 dark:border-bg-300/50 rounded-full hover:bg-bg-200 hover:text-text-200 transition-colors duration-150">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                    Site Üret
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-300 bg-transparent border border-bg-300 dark:border-bg-300/50 rounded-full hover:bg-bg-200 hover:text-text-200 transition-colors duration-150">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Sohbet Et
                </button>
            </div>
        </div>
    );
};

export default ChatboxDemo;
