import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreviewName, setPdfPreviewName] = useState(null);

  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      // Clear PDF if image is selected (optional: allow both?)
      // For now let's allow both or just one, but clearing makes UI cleaner if we want single attachment
    };
    reader.readAsDataURL(file);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPdfFile(reader.result);
      setPdfPreviewName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfPreviewName(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !pdfFile) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        pdf: pdfFile,
        pdfName: pdfPreviewName,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setPdfFile(null);
      setPdfPreviewName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {pdfPreviewName && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative group flex items-center gap-2 p-2 bg-base-200 rounded-lg border border-base-300">
            <div className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-500 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-xs font-medium truncate max-w-[150px]">{pdfPreviewName}</span>
            <button
              onClick={removePdf}
              className="ml-1 w-5 h-5 rounded-full hover:bg-base-300 flex items-center justify-center transition-colors"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={pdfInputRef}
            onChange={handlePdfChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${pdfFile ? "text-red-500" : "text-zinc-400"}`}
            onClick={() => pdfInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-primary btn-circle"
          disabled={!text.trim() && !imagePreview && !pdfFile}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;