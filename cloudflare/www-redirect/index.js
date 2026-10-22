// www.namae-studio.com は本体へ恒久の転送をする（Vercel のときと同じ動き）
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.hostname = "namae-studio.com";
    return Response.redirect(url.toString(), 308);
  },
};
