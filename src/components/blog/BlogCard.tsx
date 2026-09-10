/**
 * BlogCard — a post preview card for listing and category pages.
 */

import { Link } from "react-router-dom";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBlogDate } from "@/lib/blog-format";
import type { BlogPost } from "@/lib/blog-parse";

interface BlogCardProps {
  post: BlogPost;
  /** Larger, image-forward treatment for a featured/hero post. */
  featured?: boolean;
  className?: string;
}

export function BlogCard({ post, featured = false, className }: BlogCardProps) {
  return (
    <article className={cn("group h-full", className)}>
      <Link
        to={`/blog/${post.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {post.image && (
          <div
            className={cn(
              "w-full overflow-hidden bg-muted",
              featured ? "aspect-[16/9]" : "aspect-[16/10]",
            )}
          >
            <img
              src={post.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className={cn("flex flex-1 flex-col p-6", featured && "md:p-8")}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {post.categoryName}
            </Badge>
          </div>

          <h3
            className={cn(
              "font-display font-semibold leading-tight text-foreground transition-colors group-hover:text-primary",
              featured ? "text-2xl md:text-3xl" : "text-xl",
            )}
          >
            {post.title}
          </h3>

          {post.description && (
            <p
              className={cn(
                "mt-2 text-muted-foreground",
                featured ? "text-base line-clamp-3" : "text-sm line-clamp-2",
              )}
            >
              {post.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{post.author}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatBlogDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {post.readingTimeMinutes} min read
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
