import React, { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { FileMetadata } from '../hooks/useCollabFiles';

// Import editor workers
// @ts-ignore
self.MonacoEnvironment = {
  getWorker: function (moduleId: string, label: string) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      case 'css':
      case 'less':
      case 'scss':
        return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url));
      case 'handlebars':
      case 'html':
      case 'razor':
        return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url));
      case 'json':
        return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url));
      case 'javascript':
      case 'typescript':
        return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url));
      default:
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
    }
  },
};

// Register custom themes
monaco.editor.defineTheme('vs-dark-custom', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.lineHighlightBackground': '#2d2d2d',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
  },
});

monaco.editor.defineTheme('vs-light-custom', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editor.lineHighlightBackground': '#f5f5f5',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
  },
});

// File extension to language ID mapping
const languageMap: Record<string, string> = {
  // Web
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  
  // Common programming languages
  py: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  php: 'php',
  rb: 'ruby',
  rs: 'rust',
  swift: 'swift',
  kt: 'kotlin',
  
  // Configuration
  yml: 'yaml',
  yaml: 'yaml',
  toml: 'toml',
  
  // Shell
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  
  // Markup
  md: 'markdown',
  markdown: 'markdown',
  
  // Data
  xml: 'xml',
  sql: 'sql',
  graphql: 'graphql',
};

export interface CodeEditorProps {
  file: FileMetadata | null;
  onChange?: (content: string) => void;
  theme?: 'light' | 'dark';
  readOnly?: boolean;
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChange,
  theme = 'dark',
  readOnly = false,
  className = '',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<monaco.IDisposable | null>(null);
  const currentModelRef = useRef<monaco.editor.ITextModel | null>(null);

  // Initialize editor
  useEffect(() => {
    if (monacoEl.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(monacoEl.current, {
        value: '',
        language: 'plaintext',
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        theme: theme === 'dark' ? 'vs-dark-custom' : 'vs-light-custom',
        readOnly,
        wordWrap: 'on',
        renderWhitespace: 'selection',
        tabSize: 2,
        insertSpaces: true,
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
      });

      // Handle editor changes
      subscriptionRef.current = editorRef.current.onDidChangeModelContent(() => {
        if (onChange && !readOnly) {
          const value = editorRef.current?.getValue() || '';
          onChange(value);
        }
      });
    }

    return () => {
      subscriptionRef.current?.dispose();
      editorRef.current?.dispose();
    };
  }, [onChange, readOnly, theme]);

  // Update editor content when file changes
  useEffect(() => {
    if (!editorRef.current) return;

    // If no file is selected, clear the editor
    if (!file) {
      if (currentModelRef.current) {
        currentModelRef.current = null;
        editorRef.current.setModel(null);
      }
      return;
    }

    // Determine language from file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const language = languageMap[extension] || 'plaintext';

    // Create or update model
    if (!currentModelRef.current) {
      // Create new model
      const model = monaco.editor.createModel(
        file.content || '',
        language,
        monaco.Uri.file(file.path)
      );
      editorRef.current.setModel(model);
      currentModelRef.current = model;
    } else {
      // Update existing model
      if (currentModelRef.current.uri.toString() !== monaco.Uri.file(file.path).toString()) {
        // Different file, update model
        const model = monaco.editor.createModel(
          file.content || '',
          language,
          monaco.Uri.file(file.path)
        );
        currentModelRef.current.dispose();
        editorRef.current.setModel(model);
        currentModelRef.current = model;
      } else if (currentModelRef.current.getValue() !== file.content) {
        // Same file, different content
        currentModelRef.current.setValue(file.content || '');
      }
    }

    // Set language
    monaco.editor.setModelLanguage(currentModelRef.current, language);

    // Update editor options
    editorRef.current.updateOptions({
      readOnly: readOnly || file.isDirectory,
    });

    // Focus the editor
    editorRef.current.focus();
  }, [file, readOnly]);

  // Handle theme changes
  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark-custom' : 'vs-light-custom');
    }
  }, [theme]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      editorRef.current?.layout();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!editorRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // The actual save is handled by the parent component through the onChange prop
      }
    };

    const editorElement = editorRef.current.getDomNode();
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => editorElement.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="text-center p-6 max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium">No file selected</h3>
          <p className="mt-1 text-sm">Select a file from the explorer to view or edit its contents.</p>
        </div>
      </div>
    );
  }

  if (file.isDirectory) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="text-center p-6 max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium">Directory</h3>
          <p className="mt-1 text-sm">This is a directory. Select a file to view or edit its contents.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={monacoEl}
      className={`h-full w-full ${className}`}
      style={{
        minHeight: '300px',
        borderLeft: '1px solid #1e1e1e',
      }}
    />
  );
};

export default CodeEditor;
