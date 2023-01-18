import { assert, near } from "near-sdk-js";

/**
 * An instance of a single blog post.
 */
export class BlogPost {
  /**
   * Blog post contructor.
   *
   * @param title - The title of the blog post.
   * @param ipfs_cid - The ipfs CID of the blog post content.
   * @param thumnbnail_cid - The ipfs CID of the blog post thumbnail.
   * @param id - The ID of the blog post - by default generated as a random seed.
   * @param author_id - The account ID of the author of the blog post - by default the signer account ID.
   * @param created_at - The time of creation of the blog post - by default generated at the current block timestamp.
   * @param last_updated_at - The time of the last update of the blog post - by default generated at the current block timestamp.
   */
  constructor(
    public title: string,
    public ipfs_cid: string,
    public thumnbnail_cid: string,
    public id = near.randomSeed(),
    public author_id = near.signerAccountId(),
    public created_at = new Date(Number(near.blockTimestamp())),
    public last_updated_at = new Date(Number(near.blockTimestamp()))
  ) { }

  /**
   * Update the blog post with the provided data.
   *
   * @param updatedBlog - The data to update the blog post with.
   */
  update(updatedBlog: UpdateBlogPost): void {
    assert(
      near.signerAccountId() === this.author_id,
      "You do not have permission to perform this action!"
    );

    const keysToUpdate = Object.keys(updatedBlog);

    if (
      keysToUpdate.length > 0 &&
      keysToUpdate.every((key) =>
        ["author_id", "title", "ipfs_cid", "thumnbnail_cid"].includes(key)
      )
    ) {
      keysToUpdate.forEach((key) => (this[key] = updatedBlog[key]));
    }
  }

  /**
   * Reconstruct an instance of the blog post class from a deserialized JSON object.
   *
   * @param blog - The deserialized JSON object to reconstruct from.
   * @returns
   */
  static reconstruct(blog: BlogPost): BlogPost {
    return new BlogPost(
      blog.title,
      blog.ipfs_cid,
      blog.thumnbnail_cid,
      blog.id,
      blog.author_id,
      new Date(blog.created_at),
      new Date(blog.last_updated_at)
    );
  }
}

/**
 * The data required to create a new blog post.
 */
export type CreateBlogPost = Pick<
  BlogPost,
  "title" | "ipfs_cid" | "thumnbnail_cid"
>;

/**
 * The data that can be updated on a blog post.
 */
export type UpdateBlogPost = Partial<
  Pick<BlogPost, "author_id" | "title" | "ipfs_cid" | "thumnbnail_cid">
>;
