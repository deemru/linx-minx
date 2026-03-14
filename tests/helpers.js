// Shared helpers for upload tests

/**
 * Upload files via Dropzone's click-to-upload mechanism (filechooser).
 * Works reliably because it goes through Dropzone's native click handler.
 */
async function uploadFiles(page, files) {
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.locator('#dzone').click(),
  ]);
  await fileChooser.setFiles(files);
}

/**
 * Upload a single file and wait for the link to appear.
 * Returns the href of the uploaded file link.
 */
async function uploadAndWaitForLink(page, file) {
  await uploadFiles(page, file);
  const link = page.locator('#uploads .upload a').first();
  await link.waitFor({ state: 'visible', timeout: 10000 });
  return await link.getAttribute('href');
}

module.exports = { uploadFiles, uploadAndWaitForLink };
