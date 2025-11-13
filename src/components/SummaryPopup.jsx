import React, { useState, useEffect } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import apiService from "../services/api";

const SummaryPopup = ({ isOpen, onClose, item, itemType }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && item) {
      fetchSummary();
    } else {
      // Reset state when popup closes
      setSummary("");
      setError("");
    }
  }, [isOpen, item]);

  const fetchSummary = async () => {
    if (!item) return;

    setLoading(true);
    setError("");
    setSummary("");

    try {
      let summaryText = "";

      // Get summary based on item type
      if (itemType === "judgment") {
        // For judgments, use the backend summary endpoint (Gemini-powered)
        if (item.id) {
          try {
            const summaryResponse = await apiService.getJudgementSummary(item.id, {
              format: 'markdown'
            });
            
            if (summaryResponse && summaryResponse.success && summaryResponse.summary) {
              summaryText = summaryResponse.summary;
            } else {
              // Fallback: try to get summary from the item
              summaryText = item.summary || item.description || "";
            }
          } catch (err) {
            console.warn("Could not fetch summary from backend:", err);
            // Fallback: try to get summary from the item
            summaryText = item.summary || item.description || "";
            
            // If still no summary, try to fetch markdown and extract summary
            if (!summaryText) {
              try {
                const markdown = await apiService.getJudgementByIdMarkdown(item.id);
                // Extract first few paragraphs as summary
                const paragraphs = markdown.split("\n\n").filter(p => p.trim().length > 50);
                summaryText = paragraphs.slice(0, 3).join("\n\n");
              } catch (markdownErr) {
                console.warn("Could not fetch markdown for summary:", markdownErr);
              }
            }
          }
        } else {
          // No ID available, use item summary if available
          summaryText = item.summary || item.description || "";
        }
      } else if (itemType === "act") {
        // For acts, use description or summary field
        summaryText = item.summary || item.description || item.long_title || "";
      } else if (itemType === "mapping") {
        // For mappings, use summary or description
        summaryText = item.summary || item.description || item.source_description || "";
      }

      if (!summaryText || summaryText.trim() === "") {
        setError("Summary not available for this item.");
      } else {
        setSummary(summaryText);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError(err.message || "Failed to load summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getItemTitle = () => {
    if (itemType === "judgment") {
      return item.title || item.case_info || item.case_title || item.case_number || "Judgment";
    } else if (itemType === "act") {
      return item.short_title || item.long_title || "Act";
    } else if (itemType === "mapping") {
      return item.subject || item.title || "Mapping";
    }
    return "Item";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50" />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #1E65AD 0%, #CF9B63 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "Helvetica Hebrew Bold, sans-serif" }}
                  >
                    Summary
                  </h2>
                  <p className="text-sm text-white text-opacity-90" style={{ fontFamily: "Roboto, sans-serif" }}>
                    {getItemTitle()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                aria-label="Close popup"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600" style={{ fontFamily: "Roboto, sans-serif" }}>
                    Loading summary...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 text-center" style={{ fontFamily: "Roboto, sans-serif" }}>
                    {error}
                  </p>
                </div>
              ) : summary ? (
                <div
                  className="prose prose-sm sm:prose-base max-w-none"
                  style={{ fontFamily: "Roboto, sans-serif", color: "#1a1a1a" }}
                >
                  <div className="text-gray-700 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ marginBottom: '0.75rem', marginTop: '0.75rem' }}>{children}</p>,
                        ul: ({ children }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', marginTop: '0.75rem', listStyleType: 'disc' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', marginTop: '0.75rem', listStyleType: 'decimal' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: '0.5rem' }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ fontWeight: 'bold', color: '#1E65AD' }}>{children}</strong>,
                        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                      }}
                    >
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-600 text-center" style={{ fontFamily: "Roboto, sans-serif" }}>
                    No summary available for this item.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SummaryPopup;

