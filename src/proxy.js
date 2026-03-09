export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/my-lists/:path*", "/archives/:path*", "/api/:path*"],
};
