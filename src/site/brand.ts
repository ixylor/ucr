export const brand = {
  name: 'UCR',
  fullName: 'Universal Content Renderer',
  tagline: 'One string in. A typeset document out.',
  repository: 'https://github.com/ixylor/ucr',
  author: { name: 'Vikas Patel', url: 'https://github.com/ixylor' },
  registryPath: '/r/universal-content-renderer.json',
} as const

/**
 * The install command points at whatever origin the page is served from, so it
 * is correct on a preview deployment, the production domain and localhost alike.
 */
export function installCommand(): string {
  const origin =
    typeof window === 'undefined' ? 'https://ucr.vercel.app' : window.location.origin
  return `npx shadcn@latest add ${origin}${brand.registryPath}`
}
