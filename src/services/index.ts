export { authService } from "./authService";
export type { RegisterPayload, LoginPayload, AuthResponse } from "./authService";

export { photoService } from "./photoService";
export type { Photo, AddPhotoPayload, UpdatePhotoPayload } from "./photoService";

export { videoService } from "./videoService";
export type { Video, AddVideoPayload, UpdateVideoPayload } from "./videoService";

export { teamService } from "./teamService";
export type { TeamMember, CreateTeamPayload, UpdateTeamPayload } from "./teamService";

export { faqService } from "./faqService";
export type { FAQ, CreateFAQPayload } from "./faqService";

export { blogService } from "./blogService";
export type { Blog, AddBlogPayload, UpdateBlogPayload } from "./blogService";

export { ratingService } from "./ratingService";
export type { Rating, RatingRequestPayload } from "./ratingService";

export { contactService } from "./contactService";
export type { ContactPayload, ContactResponse } from "./contactService";

export { categoryService } from "./categoryService";
export type { Category, AddCategoryPayload } from "./categoryService";

export { seoService } from "./seoService";
export type { PageSeo, UpdatePageSeoPayload } from "./seoService";
