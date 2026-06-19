import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import Comment from "./Comment";

interface CommentData {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  userCity?: string;
  userLanguage?: string;
  likes?: number;
  dislikes?: number;
  translations?: Array<{ language: string; text: string }>;
  status?: string;
  commentedon: string;
}

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string>("Unknown");
  const [userLanguage, setUserLanguage] = useState<string>("en");

  const getUserCity = async () => {
    try {
      if (user?.city && user.city !== "Unknown") {
        setUserCity(user.city);
        return;
      }

      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      setUserCity(data.city || "Unknown");
    } catch (error) {
      console.log("Could not fetch city:", error);
      setUserCity("Unknown");
    }
  };

  useEffect(() => {
    loadComments();
    getUserCity();
  }, [videoId, user]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  const handleSubmitComment = async () => {
    const currentUser = user || {
      _id: "guest-" + Math.random().toString(36).substring(7),
      name: "Guest User",
      image: "https://github.com/shadcn.png"
    };

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: currentUser._id,
        commentbody: newComment,
        usercommented: currentUser.name,
        userCity: userCity,
        userLanguage: userLanguage,
      });

      if (res.data.comment) {
        const newCommentObj: CommentData = {
          _id: res.data.data._id,
          videoid: videoId,
          userid: currentUser._id,
          commentbody: newComment,
          usercommented: currentUser.name || "Anonymous",
          userCity: userCity,
          userLanguage: userLanguage,
          likes: 0,
          dislikes: 0,
          translations: [],
          status: "active",
          commentedon: new Date().toISOString(),
        };
        setComments([newCommentObj, ...comments]);
      }
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: CommentData) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/comment/editcomment/${editingCommentId}`,
        { commentbody: editText }
      );
      if (res.data) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === editingCommentId
              ? { ...c, commentbody: editText }
              : c
          )
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      <div className="flex gap-4">
        <Avatar className="w-10 h-10">
          <AvatarImage src={user?.image || ""} />
          <AvatarFallback>{user?.name?.[0] || "G"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e: any) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
          />
          <div className="flex gap-2 justify-between">
            <select
              value={userLanguage}
              onChange={(e) => setUserLanguage(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
              <option value="ru">Russian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
            </select>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdate={handleUpdateComment}
              editingCommentId={editingCommentId}
              editText={editText}
              setEditText={setEditText}
              setEditingCommentId={setEditingCommentId}
              currentUserId={user?._id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
