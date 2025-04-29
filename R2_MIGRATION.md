# Migrating from Cloudinary to Cloudflare R2

This guide explains how to migrate your image hosting from Cloudinary to Cloudflare R2.

## Prerequisites

Before starting, ensure you have:

- A Cloudflare account
- R2 bucket created with images uploaded
- R2 API credentials:
  - R2 Access Key ID
  - R2 Secret Access Key
  - R2 Endpoint URL

## Steps to Migrate

### 1. Deploy the R2 Worker

The R2 worker provides an interface to serve your R2 images and handle image transformations.

```bash
# Install Wrangler CLI if you haven't already
npm install -g wrangler

# Login to Cloudflare
npx wrangler login

# Deploy the worker 
npx wrangler deploy
```

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```
R2_BUCKET_NAME=your-bucket-name
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-s3-access-key-id
R2_SECRET_ACCESS_KEY=your-s3-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_IMAGE_BASE_URL=https://r2-image-worker.your-subdomain.workers.dev
```

### 3. Update the Image Components

Use the new `R2Image` component instead of Cloudinary's `CldImage`:

```jsx
// Before: Cloudinary
import { CldImage } from 'next-cloudinary';

<CldImage
  width="500"
  height="300"
  src="my-image"
  alt="Description"
/>

// After: R2
import R2Image from '@/components/R2Image';

<R2Image
  width={500}
  height={300}
  src="https://r2-image-worker.your-subdomain.workers.dev/my-image.jpg"
  alt="Description"
/>
```

### 4. Find and Replace Cloudinary Components

Use the provided script to find all Cloudinary components in your codebase:

```bash
node scripts/migrate-cloudinary-to-r2.js ./app
```

Follow the instructions in the output to replace each Cloudinary component with the R2Image component.

### 5. Testing and Validation

1. Open the `test-r2.html` file in your browser to confirm that the R2 worker is serving images correctly.
2. Run your application and verify that images are loading properly.
3. Check the network tab in your browser's developer tools to ensure images are being served from the R2 worker.

### 6. Cleanup (Optional)

After confirming everything works:

1. Remove Cloudinary dependencies:
   ```bash
   npm uninstall next-cloudinary cloudinary
   ```

2. Remove any unused Cloudinary configuration files and environment variables.

## Troubleshooting

### Image Not Loading

- Verify the R2 bucket contains the image
- Check the worker URL is correct in your .env.local
- Ensure the worker has permission to access the R2 bucket
- Check browser console for errors

### Worker Not Deploying

- Ensure you're logged in to Cloudflare: `npx wrangler whoami`
- Verify your wrangler.toml is configured correctly
- Check your account has the necessary permissions

### Slow Image Loading

- Add appropriate caching headers to the worker
- Consider enabling Cloudflare cache to speed up delivery

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Next.js Image Component](https://nextjs.org/docs/api-reference/next/image)"> 