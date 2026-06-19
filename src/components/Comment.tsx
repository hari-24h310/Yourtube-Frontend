import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { formatDistanceToNow } from "date-fns";
import axiosInstance from "@/lib/axiosinstance";

interface LanguageOption {
  label: string;
  code: string;
}

interface CommentProps {
  comment: any;
  onEdit: (comment: any) => void;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  editingCommentId: string | null;
  editText: string;
  setEditText: (text: string) => void;
  setEditingCommentId: (id: string | null) => void;
  currentUserId: string | undefined;
  languageOptions?: LanguageOption[];
}

const defaultLanguageOptions: LanguageOption[] = [
  { label: "English", code: "en" },
  { label: "Tamil", code: "ta" },
  { label: "Hindi", code: "hi" },
  { label: "Telugu", code: "te" },
  { label: "Kannada", code: "kn" },
  { label: "Malayalam", code: "ml" },
  { label: "French", code: "fr" },
  { label: "Spanish", code: "es" },
  { label: "Arabic", code: "ar" },
  { label: "Japanese", code: "ja" },
  { label: "German", code: "de" },
];

const Comment: React.FC<CommentProps> = ({
  comment,
  onEdit,
  onDelete,
  onUpdate,
  editingCommentId,
  editText,
  setEditText,
  setEditingCommentId,
  currentUserId,
  languageOptions,
}) => {
  const availableLanguages = languageOptions || defaultLanguageOptions;
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const cityLabel = typeof comment?.userCity === "string" && comment.userCity.trim() && comment.userCity.toLowerCase() !== "unknown"
    ? comment.userCity
    : null;
  const commentId = comment?._id || comment?.id;

  const extractTranslationText = (payload: any) => {
    const candidates = [
      payload?.translatedText,
      payload?.text,
      payload?.data?.translatedText,
      payload?.data?.text,
      payload?.translation,
      payload?.data?.translation,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    return "";
  };
  const [selectedLanguage, setSelectedLanguage] = useState<string>(availableLanguages[0]?.code || "en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [userLikes, setUserLikes] = useState(comment.likes || 0);
  const [userDislikes, setUserDislikes] = useState(comment.dislikes || 0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [userHasDisliked, setUserHasDisliked] = useState(false);

  const handleTranslate = async () => {
    if (!selectedLanguage || !commentId) return;

    setIsTranslating(true);
    try {
      const res = await axiosInstance.post(`/comment/translate/${commentId}`, {
        targetLanguage: selectedLanguage,
      });
      const translatedTextData = extractTranslationText(res.data);
      if (translatedTextData) {
        setTranslatedText(translatedTextData);
        setShowTranslation(true);
      } else {
        console.error("No translation text in response", res.data);
        alert("Translation response was empty. Please try again.");
      }
    } catch (error: any) {
      console.error("Translation error:", error);
      alert(`Failed to translate: ${error?.response?.data?.message || error?.message || "unknown error"}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLike = async () => {
    try {
      if (userHasLiked) {
        // Unlike - decrement count
        setUserLikes(userLikes - 1);
        setUserHasLiked(false);
      } else {
        // Like - increment count
        const res = await axiosInstance.post(`/comment/like/${comment._id}`);
        setUserLikes(res.data.likes || userLikes + 1);
        setUserHasLiked(true);
        // If was disliked, remove dislike
        if (userHasDisliked) {
          setUserDislikes(userDislikes - 1);
          setUserHasDisliked(false);
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDislike = async () => {
    try {
      if (userHasDisliked) {
        // Remove dislike - decrement count
        setUserDislikes(userDislikes - 1);
        setUserHasDisliked(false);
      } else {
        // Add dislike
        const res = await axiosInstance.post(`/comment/dislike/${comment._id}`);
        if (res.data.removed) {
          // Comment was removed due to dislikes
          onDelete(comment._id);
          return;
        }
        setUserDislikes(res.data.dislikes || userDislikes + 1);
        setUserHasDisliked(true);
        // If was liked, remove like
        if (userHasLiked) {
          setUserLikes(userLikes - 1);
          setUserHasLiked(false);
        }
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
    }
  };

  // Block the comment if it contains special characters or has been blocked
  if (comment.status === "blocked") {
    return (
      <div className="p-3 border rounded mb-2 bg-red-50">
        <p className="text-sm text-red-600 italic">
          This comment has been removed for violating community guidelines.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-3 border rounded mb-2">
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src="/placeholder.svg?height=40&width=40" />
        <AvatarFallback>{comment.usercommented?.[0] || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.usercommented}</span>
          {cityLabel && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              📍 {cityLabel}
            </span>
          )}
          <span className="text-xs text-gray-600">
            {formatDistanceToNow(new Date(comment.commentedon))} ago
          </span>
        </div>

        {editingCommentId === comment._id ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              ℹ️ Allowed: a-z, A-Z, 0-9, spaces, . , ! ? ' \" - ( ) [ ]
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  if (onUpdate) onUpdate();
                }}
                disabled={!editText.trim()}
                size="sm"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingCommentId(null);
                  setEditText("");
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mb-3">
              {showTranslation && translatedText ? translatedText : comment.commentbody}
            </p>

            {showTranslation && translatedText && (
              <div className="bg-blue-50 p-3 rounded mb-3 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold mb-1">
                  Showing translation in {
                    availableLanguages.find((option) => option.code === selectedLanguage)?.label ?? selectedLanguage.toUpperCase()
                  }
                </p>
                <p className="text-sm">{translatedText}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 items-center mt-2 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-100 transition ${
                    userHasLiked ? "text-blue-600 font-semibold" : "text-gray-600"
                  }`}
                >
                  👍 {userLikes > 0 ? userLikes : ""}
                </button>
                <button
                  onClick={handleDislike}
                  className={`flex items-center gap-1 text-sm px-2 py-1 rounded hover:bg-gray-100 transition ${
                    userHasDisliked ? "text-red-600 font-semibold" : "text-gray-600"
                  }`}
                >
                  👎 {userDislikes > 0 ? userDislikes : ""}
                </button>
              </div>

              {/* Translator */}
              <div className="flex gap-2 items-center">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  {availableLanguages.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {isTranslating ? "Translating..." : "Translate"}
                </button>
              </div>

              {/* Edit/Delete for owner */}
              {comment.userid === currentUserId && (
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => onEdit(comment)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment._id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Comment;