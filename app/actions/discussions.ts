"use server";

import { createClient } from "@/lib/supabase-server";

export async function getDiscussionChannels() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("subjects")
      .select(`
        id, course_code, course_title, semester_id,
        semesters (semester_number),
        units (id, unit_number, unit_title)
      `)
      .order("course_code", { ascending: true });

    if (error) throw error;
    return { channels: data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getUnitComments(unitId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("unit_comments")
      .select(`
        *,
        unit_comment_likes (user_id),
        unit_comment_reactions (user_id, emoji)
      `)
      .eq("unit_id", unitId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const formattedData = data.map((comment) => {
      // Group reactions by emoji and count them
      const reactionMap: Record<string, { count: number; hasReacted: boolean }> = {};
      comment.unit_comment_reactions.forEach((reaction: any) => {
        if (!reactionMap[reaction.emoji]) {
          reactionMap[reaction.emoji] = { count: 0, hasReacted: false };
        }
        reactionMap[reaction.emoji].count += 1;
        if (reaction.user_id === user.id) {
          reactionMap[reaction.emoji].hasReacted = true;
        }
      });

      return {
        ...comment,
        likesCount: comment.unit_comment_likes.length,
        hasLiked: comment.unit_comment_likes.some((like: any) => like.user_id === user.id),
        reactions: Object.entries(reactionMap).map(([emoji, data]) => ({
          emoji,
          count: data.count,
          hasReacted: data.hasReacted
        }))
      };
    });

    return { data: formattedData, currentUserId: user.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function addUnitComment(unitId: number, content: string, parentId: string | null = null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("unit_comments")
      .insert({
        unit_id: unitId,
        user_id: user.id,
        author_name: user.user_metadata?.full_name || "Anonymous Peer",
        author_avatar: user.user_metadata?.avatar_url || null,
        content: content,
        parent_id: parentId // Added for Reddit-style threading
      })
      .select()
      .single();

    if (error) throw error;
    return { data: { ...data, likesCount: 0, hasLiked: false, reactions: [] } };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleCommentLike(commentId: string, currentlyLiked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    if (currentlyLiked) {
      await supabase.from("unit_comment_likes").delete().match({ comment_id: commentId, user_id: user.id });
    } else {
      await supabase.from("unit_comment_likes").insert({ comment_id: commentId, user_id: user.id });
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleCommentReaction(commentId: string, emoji: string, hasReacted: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  try {
    if (hasReacted) {
      await supabase.from("unit_comment_reactions").delete().match({ comment_id: commentId, user_id: user.id, emoji });
    } else {
      await supabase.from("unit_comment_reactions").insert({ comment_id: commentId, user_id: user.id, emoji });
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}