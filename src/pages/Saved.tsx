import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookmarkButton from "@/components/BookmarkButton";
import HashLink from "@/components/HashLink";
import { topicLabel } from "@/lib/circle";

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

interface SavedPost {
  bookmarkId: string;
  id: string;
  body: string;
  topic_tag: string;
  is_anonymous: boolean;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
}

interface SavedResource {
  bookmarkId: string;
  itemId: string; // the URL used as item_id
  title: string;
  description: string;
  type: string;
  url: string;
}

const PostSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </div>
);

const ResourceSkeleton = () => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

const Saved = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/account/saved", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Load saved circle posts
  useEffect(() => {
    if (!user) return;
    (async () => {
      setPostsLoading(true);
      const { data: bookmarks, error } = await (supabase as any)
        .from("bookmarks")
        .select("id, item_id")
        .eq("user_id", user.id)
        .eq("item_type", "circle_post")
        .order("created_at", { ascending: false });

      if (error || !bookmarks?.length) {
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      const postIds = bookmarks.map((b: any) => b.item_id);
      const { data: postRows } = await (supabase as any)
        .from("circle_posts_public")
        .select("id, body, topic_tag, is_anonymous, author_name, published_at, created_at")
        .in("id", postIds);

      const postMap: Record<string, any> = {};
      (postRows ?? []).forEach((p: any) => { postMap[p.id] = p; });

      const result: SavedPost[] = bookmarks
        .filter((b: any) => postMap[b.item_id])
        .map((b: any) => ({ bookmarkId: b.id, ...postMap[b.item_id] }));

      setPosts(result);
      setPostsLoading(false);
    })();
  }, [user]);

  // Load saved resources — fetch all from edge function then match against bookmarks
  useEffect(() => {
    if (!user) return;
    (async () => {
      setResourcesLoading(true);
      const [{ data: bookmarks }, resourceRes] = await Promise.all([
        (supabase as any)
          .from("bookmarks")
          .select("id, item_id")
          .eq("user_id", user.id)
          .eq("item_type", "resource")
          .order("created_at", { ascending: false }),
        fetch(`${SUPABASE_URL}/functions/v1/fetch-resources`).then(r => r.json()).catch(() => ({ resources: [] })),
      ]);

      if (!bookmarks?.length) {
        setResources([]);
        setResourcesLoading(false);
        return;
      }

      const allResources: Array<{ title: string; description: string; type: string; url: string }> =
        resourceRes.resources ?? [];

      const resourceMap: Record<string, any> = {};
      allResources.forEach(r => { resourceMap[r.url] = r; });

      const result: SavedResource[] = bookmarks
        .filter((b: any) => resourceMap[b.item_id])
        .map((b: any) => ({
          bookmarkId: b.id,
          itemId: b.item_id,
          ...resourceMap[b.item_id],
        }));

      setResources(result);
      setResourcesLoading(false);
    })();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-3xl">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Home
          </Link>

          {/* Page heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Bookmark size={20} className="text-blush-dark fill-blush-dark" />
              <h1 className="font-heading text-3xl md:text-4xl text-foreground">Saved</h1>
            </div>
            <p className="text-muted-foreground font-body">Posts and resources you've bookmarked.</p>
          </div>

          <Tabs defaultValue="posts">
            <TabsList className="mb-6">
              <TabsTrigger value="posts">
                Circle Posts {!postsLoading && posts.length > 0 && (
                  <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                    {posts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources">
                Resources {!resourcesLoading && resources.length > 0 && (
                  <span className="ml-1.5 text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
                    {resources.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Circle Posts ── */}
            <TabsContent value="posts">
              {postsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <Bookmark size={36} className="mx-auto text-muted-foreground mb-3" />
                  <p className="font-body text-muted-foreground mb-4">No saved posts yet.</p>
                  <Link
                    to="/circle"
                    className="text-sm font-body font-medium text-foreground underline underline-offset-4 hover:text-blush-dark"
                  >
                    Browse the Circle →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <article
                      key={post.bookmarkId}
                      className="relative rounded-2xl border border-border bg-card p-5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{topicLabel(post.topic_tag)}</Badge>
                        <BookmarkButton
                          itemType="circle_post"
                          itemId={post.id}
                          onToggle={(saved) => {
                            if (!saved) setPosts(prev => prev.filter(p => p.id !== post.id));
                          }}
                        />
                      </div>
                      <p className="font-body text-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed mb-3">
                        {post.body}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-body">
                          {post.is_anonymous ? "A sister in the circle" : post.author_name ?? "A member"}
                          {" · "}
                          {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
                        </p>
                        <Link
                          to="/circle"
                          className="text-xs font-body text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          View in Circle <ExternalLink size={10} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Resources ── */}
            <TabsContent value="resources">
              {resourcesLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <ResourceSkeleton key={i} />)}
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-20">
                  <Bookmark size={36} className="mx-auto text-muted-foreground mb-3" />
                  <p className="font-body text-muted-foreground mb-4">No saved resources yet.</p>
                  <HashLink
                    to="/#resources"
                    className="text-sm font-body font-medium text-foreground underline underline-offset-4 hover:text-blush-dark"
                  >
                    Browse Resources →
                  </HashLink>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {resources.map(resource => (
                    <div
                      key={resource.bookmarkId}
                      className="relative group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                    >
                      <BookmarkButton
                        itemType="resource"
                        itemId={resource.itemId}
                        className="absolute top-3 right-3 z-10"
                        onToggle={(saved) => {
                          if (!saved) setResources(prev => prev.filter(r => r.itemId !== resource.itemId));
                        }}
                      />
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col flex-1"
                      >
                        <div className="flex items-start gap-3 mb-3 pr-6">
                          <span className="text-xl flex-shrink-0 mt-0.5">🦋</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading text-sm font-semibold text-foreground group-hover:text-blush-dark transition-colors line-clamp-2">
                              {resource.title}
                            </h4>
                            <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground mt-1 inline-block">
                              {resource.type === "pdf" ? "PDF" : "Article"}
                            </span>
                          </div>
                        </div>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground font-body line-clamp-3 flex-1">
                            {resource.description}
                          </p>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Saved;
