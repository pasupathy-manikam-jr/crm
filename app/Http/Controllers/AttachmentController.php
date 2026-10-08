<?php

namespace App\Http\Controllers;

use App\Http\Requests\Crm\AttachmentRequest;
use App\Models\Attachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function store(AttachmentRequest $request): RedirectResponse
    {
        /** @var UploadedFile $file */
        $file = $request->file('file');
        $type = (string) $request->validated('attachable_type');

        Attachment::create([
            'attachable_type' => $type,
            'attachable_id' => (int) $request->validated('attachable_id'),
            'name' => $file->getClientOriginalName(),
            'path' => $file->store("attachments/{$type}", 'local'),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'user_id' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name uploaded.', ['name' => $file->getClientOriginalName()])]);

        return back();
    }

    /**
     * Download, only while the record it is on is visible to the user.
     */
    public function show(Attachment $attachment): StreamedResponse
    {
        abort_if($attachment->attachable === null, 404);

        return Storage::disk('local')->download($attachment->path, $attachment->name);
    }

    /**
     * Uploaders delete their own files; admins any.
     */
    public function destroy(Request $request, Attachment $attachment): RedirectResponse
    {
        abort_if($attachment->attachable === null, 404);
        abort_unless($attachment->user_id === $request->user()->id || $request->user()->can('manage-users'), 403);

        $attachment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name deleted.', ['name' => $attachment->name])]);

        return back();
    }
}
