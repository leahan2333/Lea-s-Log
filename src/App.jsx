import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, 
  ChevronLeft, 
  Send,
  Loader2,
  Sun,
  Moon,
  Trash2,
  Globe,
  Music, 
  Headphones,
  Image as ImageIcon,
  Lock,
  LogOut,
  X
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyAKjK1FFWZs6ISImu5fU3yYKxyJZqD3dpg",
  authDomain: "lea-s-log.firebaseapp.com",
  projectId: "lea-s-log",
  storageBucket: "lea-s-log.firebasestorage.app",
  messagingSenderId: "51876395296",
  appId: "1:51876395296:web:3aa187b6a93099cea77f45",
  measurementId: "G-X3D76N1Z8C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'leas-log-v1';

// --- KaTeX Loader & Parser ---
const useKaTeX = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.katex) { setIsLoaded(true); return; }
    const link = document.createElement('link');
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, []);
  return isLoaded;
};

const FormattedContent = ({ content, className = "" }) => {
  const katexLoaded = useKaTeX();
  const renderedContent = React.useMemo(() => {
    if (!content) return null;
    const blockParts = content.split(/(\$\$[\s\S]*?\$\$)/g);
    return blockParts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        if (katexLoaded && window.katex) {
          try {
            const html = window.katex.renderToString(math, { displayMode: true, throwOnError: false });
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-4" />;
          } catch (e) { return <div key={index} className="text-red-500 font-mono text-sm">{part}</div>; }
        }
        return <div key={index} className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">{part}</div>;
      }
      const inlineParts = part.split(/(\$[^$]+?\$)/g);
      return (
        <span key={index} className="whitespace-pre-wrap">
          {inlineParts.map((subPart, subIndex) => {
            if (subPart.startsWith('$') && subPart.endsWith('$')) {
              const math = subPart.slice(1, -1);
              if (katexLoaded && window.katex) {
                try {
                  const html = window.katex.renderToString(math, { displayMode: false, throwOnError: false });
                  return <span key={subIndex} dangerouslySetInnerHTML={{ __html: html }} />;
                } catch (e) { return <span key={subIndex} className="text-red-500 font-mono text-sm">{subPart}</span>; }
              }
              return <span key={subIndex} className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{subPart}</span>;
            }
            return subPart;
          })}
        </span>
      );
    });
  }, [content, katexLoaded]);
  return <div className={className}>{renderedContent}</div>;
};

// --- Custom Modal Components ---

const AdminModal = ({ isOpen, onClose, onSubmit, isAdmin, onLogout }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password, setError);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform scale-100 transition-all font-sans relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${isAdmin ? 'bg-green-100 text-green-600' : 'bg-[#d9534f]/10 text-[#d9534f]'}`}>
              {isAdmin ? <Lock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {isAdmin ? 'Admin Active' : 'Admin Login'}
          </h3>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            {isAdmin ? 'You are currently logged in as Lea.' : 'Enter your secret key to unlock editing.'}
          </p>
          
          {isAdmin ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter Password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#d9534f] focus:ring-4 focus:ring-[#d9534f]/10 outline-none transition-all text-center text-lg tracking-widest text-gray-900 dark:text-white"
                />
                {error && <p className="text-red-500 text-xs text-center mt-2 animate-in slide-in-from-top-1">{error}</p>}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl font-bold bg-[#d9534f] text-white hover:bg-[#c9302c] shadow-lg shadow-[#d9534f]/20 active:scale-[0.98] transition-all"
              >
                Unlock
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Components ---

const Navbar = ({ onViewChange, currentView, user, theme, toggleTheme, lang, toggleLang, isAdmin, onSecretTrigger }) => (
  <nav className="sticky top-0 z-50 bg-[#f9f5ec]/95 dark:bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Imperial+Script:wght@400&display=swap');`}</style>
    <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between font-serif">
      <button 
        onClick={() => onViewChange('list')}
        onDoubleClick={onSecretTrigger}
        className="text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 hover:text-[#d9534f] dark:hover:text-[#ff6b6b] transition-colors select-none"
        style={{ fontFamily: "'Imperial Script', cursive", fontWeight: 400 }}
      >
        <span className="mr-3">Lea's</span>Log
      </button>

      <div className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base">
        <button onClick={() => onViewChange('list')} className={`hover:text-[#d9534f] dark:hover:text-[#ff6b6b] transition-colors ${currentView === 'list' ? 'text-[#d9534f] dark:text-[#ff6b6b] underline underline-offset-4' : 'text-gray-600 dark:text-gray-400'}`}>{lang === 'en' ? 'Posts' : '文章'}</button>
        <button onClick={() => onViewChange('archive')} className={`hover:text-[#d9534f] dark:hover:text-[#ff6b6b] transition-colors ${currentView === 'archive' ? 'text-[#d9534f] dark:text-[#ff6b6b] underline underline-offset-4' : 'text-gray-600 dark:text-gray-400'}`}>{lang === 'en' ? 'Archive' : '归档'}</button>
        <button onClick={() => onViewChange('faq')} className={`hover:text-[#d9534f] dark:hover:text-[#ff6b6b] transition-colors ${currentView === 'faq' ? 'text-[#d9534f] dark:text-[#ff6b6b] underline underline-offset-4' : 'text-gray-600 dark:text-gray-400'}`}>FAQ</button>

        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
           <button onClick={toggleLang} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors font-sans text-xs font-bold w-8 h-8 flex items-center justify-center">{lang === 'en' ? '中' : 'EN'}</button>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">{theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
        </div>

        {user && isAdmin && (
          <button onClick={() => onViewChange('create')} className="text-[#d9534f] hover:text-[#c9302c] transition-colors animate-in fade-in zoom-in ml-2" title="Write Post"><PenTool className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  </nav>
);

const PostList = ({ posts, onViewPost, onDeletePost, userId, loading, lang, isAdmin }) => {
  const introText = {
    en: { title: "👋 Hello Visitors, Welcome to Lea's Log", content: "Hi, this is Lea. I'm documenting my learning notes in this blog. Here you'll find my thoughts on software, experiments with code, and everything in between." },
    zh: { title: "👋你好啊陌生人，欢迎来逛我的Blog", content: "你好👋，这里是刘墨涵的博客，这里有我尝试在情绪翻涌时与文字相伴的记录，或引用，或原创。欢迎浏览" }
  };

  if (loading) return <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-serif"><Loader2 className="w-6 h-6 animate-spin mb-4" /><p>Loading...</p></div>;

  return (
    <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-serif">
      <section className="mb-16 border-b border-gray-200 dark:border-gray-800 pb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 font-serif">{introText[lang].title}</h1>
        <p className="text-xl text-gray-800 dark:text-gray-200 leading-relaxed">{introText[lang].content}</p>
      </section>

      {posts.length === 0 ? (
        <div className="py-20 text-center font-serif text-gray-500"><p>{lang === 'en' ? 'No posts found.' : '暂无文章。'}</p></div>
      ) : (
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="group">
              <header className="mb-2">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-sans">{new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-[#d9534f] dark:hover:text-[#ff6b6b] transition-colors inline-block" onClick={() => onViewPost(post)}>{post.title}</h2>
              </header>
              {post.imageUrl && <div className="mb-4 rounded-xl overflow-hidden cursor-pointer" onClick={() => onViewPost(post)}><img src={post.imageUrl} alt={post.title} className="w-full h-48 sm:h-64 object-cover transform group-hover:scale-105 transition-transform duration-500" /></div>}
              {post.audioUrl && <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800/50 p-2 rounded-lg mb-4 max-w-md"><div className="p-1.5 bg-[#d9534f]/10 dark:bg-[#d9534f]/20 rounded-full text-[#d9534f]"><Headphones className="w-3 h-3" /></div><audio controls src={post.audioUrl} className="h-6 w-full opacity-80" /></div>}
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 line-clamp-3"><FormattedContent content={post.content} /></div>
              <div className="flex items-center gap-4 text-sm font-sans">
                <button onClick={() => onViewPost(post)} className="text-[#d9534f] dark:text-[#ff6b6b] hover:underline">{lang === 'en' ? 'Read more' : '阅读全文'}</button>
                {isAdmin && <button onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" />{lang === 'en' ? 'Delete' : '删除'}</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

const PostDetail = ({ post, onBack, lang }) => (
  <div className="py-8 animate-in fade-in zoom-in-95 duration-300 font-serif">
    <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#d9534f] dark:hover:text-[#ff6b6b] mb-12 transition-colors font-sans text-sm"><ChevronLeft className="w-4 h-4" />{lang === 'en' ? 'Back' : '返回'}</button>
    <article className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-serif prose-p:font-serif prose-a:text-[#d9534f] dark:prose-a:text-[#ff6b6b] text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">{post.title}</h1>
      <div className="text-gray-500 dark:text-gray-400 text-sm font-sans mb-8 border-b border-gray-200 dark:border-gray-800 pb-8">{new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full max-h-[500px] object-cover rounded-xl mb-8 shadow-sm" />}
      {post.audioUrl && <div className="flex items-center gap-4 bg-[#f1efe9] dark:bg-gray-800 p-4 rounded-xl mb-8 border border-gray-200 dark:border-gray-700"><div className="p-3 bg-white dark:bg-gray-700 rounded-full text-[#d9534f] shadow-sm"><Music className="w-5 h-5" /></div><div className="flex-1"><div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Audio Companion</div><audio controls src={post.audioUrl} className="w-full h-8" /></div></div>}
      <div className="leading-loose"><FormattedContent content={post.content} /></div>
    </article>
  </div>
);

const CreatePost = ({ onCancel, onSubmit, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e) => { e.preventDefault(); if (!title.trim() || !content.trim()) return; onSubmit({ title, content, audioUrl, imageUrl }); };

  return (
    <div className="py-8 animate-in slide-in-from-bottom-8 duration-500 font-serif">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">New Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-3 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#d9534f] dark:focus:border-[#ff6b6b] outline-none transition-colors" required /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3 text-gray-500 focus-within:text-[#d9534f] transition-colors"><ImageIcon className="w-5 h-5" /><input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Cover Image URL (Optional)" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#d9534f] dark:focus:border-[#ff6b6b] outline-none transition-colors font-sans" /></div>
          <div className="flex items-center gap-3 text-gray-500 focus-within:text-[#d9534f] transition-colors"><Music className="w-5 h-5" /><input type="url" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="Audio URL (Optional)" className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 py-2 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:border-[#d9534f] dark:focus:border-[#ff6b6b] outline-none transition-colors font-sans" /></div>
        </div>
        <div><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your thoughts... Use $ for inline math and $$ for block math." className="w-full h-[60vh] bg-transparent border-none p-0 text-lg leading-relaxed text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-0 resize-none outline-none font-mono" required /></div>
        <div className="flex items-center justify-end gap-4 border-t border-gray-200 dark:border-gray-800 pt-6 font-sans">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-[#d9534f] hover:bg-[#c9302c] text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Send className="w-4 h-4" />Publish</>}</button>
        </div>
      </form>
    </div>
  );
};

const Archive = ({ posts, onViewPost, lang }) => (
  <div className="py-8 font-serif animate-in fade-in duration-500">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{lang === 'en' ? 'Archive' : '归档'}</h1>
    <div className="space-y-4">{posts.length > 0 ? (posts.map(post => (<div key={post.id} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 border-b border-gray-100 dark:border-gray-800 pb-2"><span className="text-sm font-sans text-gray-500 dark:text-gray-500 w-32 shrink-0">{new Date(post.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</span><button onClick={() => onViewPost(post)} className="text-lg text-[#d9534f] dark:text-[#ff6b6b] hover:underline text-left">{post.title}</button></div>))) : (<p className="text-gray-500">{lang === 'en' ? 'No archives yet.' : '暂无文章。'}</p>)}</div>
  </div>
);

const FAQ = ({ lang }) => (
  <div className="py-8 font-serif animate-in fade-in duration-500 prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-300">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h1>
    <div className="space-y-8">
      <div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What is Lea's Log?</h3><p>This is a personal blog where I share my thoughts, tutorials, and experiences in software development.</p></div>
      <div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">How can I contact you?</h3><p>You can reach out via email or follow me on social media. (Add your details here!)</p></div>
      <div><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Can I use your code?</h3><p>Most code snippets are open source unless stated otherwise. Feel free to learn from them!</p></div>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('list');
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  useEffect(() => {
    const adminStatus = localStorage.getItem('blog_admin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  // Show Modal instead of window.prompt
  const handleSecretTrigger = () => {
    setIsModalOpen(true);
  };

  const handleAdminSubmit = (password, setError) => {
    if (password === 'LHy20010203!') {
      setIsAdmin(true);
      localStorage.setItem('blog_admin', 'true');
      setIsModalOpen(false);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('blog_admin');
    setIsModalOpen(false);
    setView('list');
  };

// 1. Auth Initialization
  useEffect(() => {
    // Simply sign in anonymously when the app starts
    signInAnonymously(auth).catch((error) => {
      console.error("Auth failed:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const postsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'posts');
    const unsubscribe = onSnapshot(postsCollection, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postsData.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(postsData);
      setLoading(false);
    }, (error) => { console.error("Error fetching posts:", error); setLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const handleCreatePost = async ({ title, content, audioUrl, imageUrl }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'posts'), { title, content, audioUrl: audioUrl || '', imageUrl: imageUrl || '', authorId: user.uid, createdAt: Date.now() });
      setView('list');
    } catch (error) { console.error("Error creating post:", error); } finally { setSubmitting(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!user || !window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'posts', postId));
      if (selectedPost?.id === postId) { setView('list'); setSelectedPost(null); }
    } catch (error) { console.error("Error deleting post:", error); }
  };

  const handleViewPost = (post) => { setSelectedPost(post); setView('detail'); window.scrollTo(0, 0); };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-[#f9f5ec] dark:bg-[#202020] text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navbar 
          onViewChange={(v) => { setView(v); window.scrollTo(0, 0); }} 
          currentView={view} user={user} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} 
          isAdmin={isAdmin} onSecretTrigger={handleSecretTrigger} 
        />
        
        <AdminModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAdminSubmit}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />

        <main className="max-w-3xl mx-auto px-6 pb-20 pt-8">
          {view === 'list' && <PostList posts={posts} onViewPost={handleViewPost} onDeletePost={handleDeletePost} userId={user?.uid} loading={loading} lang={lang} isAdmin={isAdmin} />}
          {view === 'detail' && selectedPost && <PostDetail post={selectedPost} onBack={() => setView('list')} lang={lang} />}
          {view === 'create' && <CreatePost onCancel={() => setView('list')} onSubmit={handleCreatePost} isSubmitting={submitting} />}
          {view === 'archive' && <Archive posts={posts} onViewPost={handleViewPost} lang={lang} />}
          {view === 'faq' && <FAQ lang={lang} />}
        </main>
        <footer className="py-12 mt-auto text-center"><div className="text-gray-400 dark:text-gray-600 text-sm font-serif"><p>© {new Date().getFullYear()} Lea's Log. | Built with Coconut Water</p></div></footer>
      </div>
    </div>
  );
}