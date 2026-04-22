import { useCollabStore } from "../../store/useCollabStore";
import { useAuthStore } from "../../store/useAuthStore";
import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { MonacoBinding } from "y-monaco";

const USE_CRDT = import.meta.env.VITE_USE_CRDT === "true";

const CollabEditor = ({ sessionId }) => {
  const { activeFile, sendCode, ydoc, provider, awareness, installedExtensions } = useCollabStore();
  const { authUser } = useAuthStore();
  const editorRef = useRef(null);
  const [editorValue, setEditorValue] = useState("");

  // Determine language capabilities based on installed extensions
  useEffect(() => {
    if (!activeFile) return;

    if (activeFile.name.endsWith('.py')) {
      const isPythonInstalled = installedExtensions.has("ms-python.python") || installedExtensions.has("python");
      if (!isPythonInstalled) {
        // Optional: Show a hint or warning bar
        // console.log("Suggestion: Install Python extension for better support");
      } else {
        // Simulate Extension Feature
        // console.log("Python Language Server: Active");
      }
    }
  }, [activeFile, installedExtensions]);

  useEffect(() => {
    if (!USE_CRDT && activeFile) {
      setEditorValue(activeFile.content || "");
    } else if (!activeFile) {
      setEditorValue("");
    }
  }, [activeFile]);

  // Helper to determine language
  const getLanguage = (filename) => {
    if (!filename) return "javascript";
    if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".html")) return "html";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    return "javascript";
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    if (USE_CRDT && ydoc && awareness) {
      const yText = ydoc.getText("codetext");
      const monacoBinding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awareness,
      );

      // Set user awareness info
      awareness.setLocalState({
        name: authUser.fullName,
        color: "#ff0000", // You can generate random colors for users
      });
    }
  };

  const handleEditorChange = (value) => {
    if (!USE_CRDT) {
      setEditorValue(value);
      if (activeFile) {
        sendCode(sessionId, value);
      }
    }
  };

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        language={getLanguage(activeFile?.name)}
        value={editorValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CollabEditor;
