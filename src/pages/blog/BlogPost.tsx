/**
 * Blog post — `/blog/:slug`.
 *
 * Renders a single article from markdown with full SEO/AEO metadata:
 * BlogPosting + Breadcrumb JSON-LD, Open Graph `article` tags, canonical URL,
 * and semantic heading structure (a single H1, prose body).
 */

import { Link, useParams } from "react-router-dom";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { BlogCard } from "@/components/blog/BlogCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/structured-data";
import {
  getPostBySlug,
  getRelatedPosts,
  getCategoryDef,
  BLOG_PUBLISHED,
} from "@/lib/blog";
import { formatBlogDate } from "@/lib/blog-format";
import { CalendarDays, Clock, ChevronRight, ArrowLeft } from "lucide-react";

const BlogPost = () => {
  const { slug = "" } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <BlogLayout>
        <SEOHead title="Post not found" canonical={`/blog/${slug}`} noindex />
        <div className="mx-auto max-w-md py-16 text-center">
          <h1 className="font-display text-3xl font-bold">Post not found</h1>
          <p className="mt-3 text-muted-foreground">
            This article may have moved or isn't published yet.
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the blog
          </Link>
        </div>
      </BlogLayout>
    );
  }

  const category = getCategoryDef(post.category);
  const related = getRelatedPosts(post);
  const showUpdated = post.updated && post.updated !== post.date;

  return (
    <BlogLayout activeCategory={post.category}>
      <SEOHead
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.image}
        noindex={!BLOG_PUBLISHED}
        structuredData={[
          blogPostingSchema({
            title: post.title,
            description: post.description,
            slug: post.slug,
            author: post.author,
            datePublished: post.date,
            dateModified: post.updated,
            image: post.image,
            tags: post.tags,
            categoryName: post.categoryName,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            ...(category
              ? [{ name: category.name, path: `/blog/category/${category.slug}` }]
              : []),
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <article className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          <Link to="/blog" className="transition-colors hover:text-foreground">
            Blog
          </Link>
          {category && (
            <>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <Link
                to={`/blog/category/${category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            </>
          )}
        </nav>

        {/* Header */}
        <header className="mt-6">
          {category && (
            <Link to={`/blog/category/${category.slug}`}>
              <Badge variant="secondary" className="font-medium">
                {category.name}
              </Badge>
            </Link>
          )}
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {post.title}
          </h1>
          {post.description && (
            <p className="mt-4 text-lg text-muted-foreground">
              {post.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{post.author}</span>
            {post.authorTitle && <span>{post.authorTitle}</span>}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {post.readingTimeMinutes} min read
            </span>
          </div>
          {showUpdated && (
            <p className="mt-1 text-xs text-muted-foreground">
              Updated <time dateTime={post.updated}>{formatBlogDate(post.updated)}</time>
            </p>
          )}
        </header>

        {/* Hero image */}
        {post.image && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-muted">
            <img
              src={post.image}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-semibold prose-a:text-primary prose-img:rounded-xl"
          // Content is authored in-repo markdown, not user input — safe to inject.
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <span className="text-sm text-muted-foreground">Tags:</span>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl" aria-labelledby="related-heading">
          <h2 id="related-heading" className="font-display text-2xl font-semibold">
            Keep reading
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </BlogLayout>
  );
};

export default BlogPost;
