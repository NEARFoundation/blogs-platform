// Find all our documentation at https://docs.near.org
import {
  NearBindgen,
  near,
  call,
  view,
  UnorderedSet,
  UnorderedMap,
  assert,
} from "near-sdk-js";
import { AccountId } from "near-sdk-js/lib/types";
import { BlogPost, CreateBlogPost, UpdateBlogPost } from "./models";

@NearBindgen({ requireInit: true })
export class BlogContract {
  moderators: UnorderedSet<AccountId>;
  authors: UnorderedSet<AccountId>;
  denylist: UnorderedSet<AccountId>;
  blog_posts: UnorderedMap<BlogPost>;

  /**
   * Assert that the call received exactly 1 yoctoNEAR as a deposit.
   *
   * @returns
   */
  #assert_one_yocto(): void {
    assert(
      near.attachedDeposit() === 1n,
      "You need to deposit exactly 1yoctoNEAR!"
    );
  }

  /**
   * Assert that the account ID is in the authors set.
   *
   * @param account_id - The account ID to check for - by default the signer account ID.
   * @returns
   */
  #assert_is_author(account_id = near.signerAccountId()): void {
    assert(
      this.authors.contains(account_id),
      "You are not registered as an author, please register!"
    );
  }

  /**
   * Assert that the account ID is not in the deny list.
   *
   * @param account_id - The account ID to check for - by default the signer account ID.
   * @returns
   */
  #assert_not_in_deny_list(account_id = near.signerAccountId()): void {
    assert(
      !this.denylist.contains(account_id),
      "This account is in the denylist!"
    );
  }

  /**
   * Add moderators to the moderators set.
   *
   * @param param - Parameters
   * @param param.moderators - The moderators to add to the moderators list.
   * @returns
   */
  @call({ payableFunction: true })
  add_moderators({ moderators }: { moderators: AccountId[] }): void {
    this.#assert_one_yocto();
    this.#assert_not_in_deny_list();

    assert(
      near.signerAccountId() === near.currentAccountId() ||
      this.moderators.contains(near.signerAccountId()),
      "You do not have permission to perform this action!"
    );

    moderators.forEach((moderator) => this.#assert_not_in_deny_list(moderator));

    this.moderators.extend(moderators);
  }

  /**
   * Remove moderators from the moderators set.
   *
   * @param param - Parameters
   * @param param.moderators - The moderators to remove from the moderators list.
   * @returns
   */
  @call({ payableFunction: true })
  remove_moderators({ moderators }: { moderators: AccountId[] }): void {
    this.#assert_one_yocto();

    assert(
      near.signerAccountId() === near.currentAccountId() ||
      this.moderators.contains(near.signerAccountId()),
      "You do not have permission to perform this action!"
    );

    moderators.forEach((moderator) => this.moderators.remove(moderator));
  }

  /**
   * Register as an author.
   *
   * @returns
   */
  @call({ payableFunction: true })
  register(): void {
    this.#assert_one_yocto();
    this.#assert_not_in_deny_list();

    this.authors.set(near.signerAccountId());
  }

  /**
   * Get the list of authors.
   *
   * @param param - Parameters
   * @param param.limit - The max number of authors to return.
   * @param param.from - The number of authors to skip.
   * @returns
   */
  @view({})
  get_authors({
    limit = 20,
    from = 0,
  }: {
    limit?: number;
    from?: number;
  }): AccountId[] {
    return this.authors.toArray().slice(from, from + limit);
  }

  /**
   * Create a new blog post.
   *
   * @param param - Parameters
   * @param param.title - The title of the blog post.
   * @param param.ipfs_cid - The ipfs CID of the blog post content.
   * @param param.thumnbnail_cid - The ipfs CID of the blog post thumnbnail_cid.
   * @returns
   */
  @call({ payableFunction: true })
  create_blog_post({
    title,
    ipfs_cid,
    thumnbnail_cid,
  }: CreateBlogPost): BlogPost {
    this.#assert_is_author();

    const blogPost = new BlogPost(title, ipfs_cid, thumnbnail_cid);

    this.blog_posts.set(blogPost.id, blogPost);

    return blogPost;
  }

  /**
   * Update an existing blog post.
   *
   * @param param - Parameters
   * @param param.blog_id - The blog post ID.
   * @param param.update_blog - The blog the blog post details to update.
   * @param param.update_blog.title - The title of the blog post.
   * @param param.update_blog.ipfs_cid - The ipfs CID of the blog post content.
   * @param param.update_blog.thumnbnail_cid - The ipfs CID of the blog post thumnbnail_cid.
   * @param param.update_blog.author_id - The account ID of the author.
   * @returns
   */
  @call({ payableFunction: true })
  update_blog_post({
    blog_id,
    update_blog,
  }: {
    blog_id: string;
    update_blog: UpdateBlogPost;
  }): BlogPost {
    this.#assert_is_author();

    const blogPost = this.blog_posts.get(blog_id, {
      reconstructor: BlogPost.reconstruct,
    });

    assert(!!blogPost, "The requested blog post doesn't exist!");

    if (update_blog.author_id) {
      this.#assert_not_in_deny_list(update_blog.author_id);
    }

    blogPost.update(update_blog);

    this.blog_posts.set(blog_id, blogPost, {
      reconstructor: BlogPost.reconstruct,
    });

    return blogPost;
  }

  /**
   * Remove an existing blog post.
   *
   * @param param - Parameters
   * @param param.blog_id - The blog post ID.
   * @returns
   */
  @call({})
  remove_blog_post({ blog_id }: { blog_id: string }): BlogPost {
    this.#assert_is_author();

    const blogPost = this.blog_posts.get(blog_id, {
      reconstructor: BlogPost.reconstruct,
    });

    assert(!!blogPost, "The requested blog post doesn't exist!");

    assert(
      near.signerAccountId() === blogPost.author_id,
      "You don't have permission to perform this action!"
    );

    return this.blog_posts.remove(blog_id);
  }

  /**
   * Get a blog post.
   *
   * @param param - Parameters
   * @param param.blog_id - The blog post ID.
   * @returns
   */
  @view({})
  get_blog_post({ blog_id }: { blog_id: string }): BlogPost {
    return this.blog_posts.get(blog_id, {
      reconstructor: BlogPost.reconstruct,
    });
  }

  /**
   * Get the list of blog posts.
   *
   * @param param - Parameters
   * @param param.limit - The max number of authors to return.
   * @param param.from - The number of authors to skip.
   * @param param.author_id - The author ID to filter by.
   * @returns
   */
  @view({})
  get_blog_posts({
    limit = 20,
    from = 0,
    author_id,
  }: {
    limit?: number;
    from?: number;
    author_id?: AccountId;
  }): BlogPost[] {
    return this.blog_posts
      .toArray()
      .map(([, blogPost]) => blogPost)
      .filter((blogPost) =>
        author_id ? blogPost.author_id === author_id : true
      )
      .slice(from, from + limit);
  }
}
