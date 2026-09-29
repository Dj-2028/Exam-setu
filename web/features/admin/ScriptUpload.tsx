"use client";

import { useState, useCallback, useRef } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

interface UploadItem {
  barcode: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
  scriptId?: string;
}

interface ScriptUploadProps {
  paperId: string;
  onComplete?: () => void;
}

export function ScriptUpload({ paperId, onComplete }: ScriptUploadProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback(
    (barcode: string, updates: Partial<UploadItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.barcode === barcode ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadItem[] = Array.from(files)
        .filter((f) => f.type === "application/pdf")
        .map((file) => ({
          barcode: file.name.replace(/\.pdf$/i, ""),
          file,
          status: "pending" as const,
          progress: 0,
        }));

      setItems((prev) => [...prev, ...newItems]);
    },
    []
  );

  const removeItem = useCallback((barcode: string) => {
    setItems((prev) => prev.filter((item) => item.barcode !== barcode));
  }, []);

  const uploadAll = useCallback(async () => {
    const pending = items.filter((item) => item.status === "pending");

    for (const item of pending) {
      try {
        updateItem(item.barcode, { status: "uploading", progress: 10 });

        // Step 1: Initiate upload — get pre-signed URL
        const initResponse = await api.post<{
          script_id: string;
          upload_url: string;
          storage_key: string;
        }>("/scripts/upload", {
          paper_id: paperId,
          barcode: item.barcode,
          content_type: "application/pdf",
        });

        updateItem(item.barcode, {
          progress: 30,
          scriptId: initResponse.script_id,
        });

        // Step 2: Upload file directly to R2 via pre-signed URL
        await fetch(initResponse.upload_url, {
          method: "PUT",
          body: item.file,
          headers: { "Content-Type": "application/pdf" },
        });

        updateItem(item.barcode, { progress: 60 });

        // Step 3: Confirm upload — triggers processing pipeline
        await api.post(`/scripts/${initResponse.script_id}/confirm`, {
          page_count: 0,
        });

        updateItem(item.barcode, {
          status: "processing",
          progress: 80,
        });

        // Mark as done (processing continues in background)
        updateItem(item.barcode, { status: "done", progress: 100 });
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "error" in err
              ? (err as { error: { message: string } }).error.message
              : "Upload failed";

        updateItem(item.barcode, {
          status: "error",
          error: message,
        });
      }
    }

    onComplete?.();
  }, [items, paperId, updateItem, onComplete]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const totalPending = items.filter((i) => i.status === "pending").length;
  const totalDone = items.filter((i) => i.status === "done").length;
  const totalError = items.filter((i) => i.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop PDF answer scripts here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse • PDF files only
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Upload queue */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {items.length} script{items.length !== 1 ? "s" : ""}
              {totalDone > 0 && (
                <span className="text-success ml-2">• {totalDone} done</span>
              )}
              {totalError > 0 && (
                <span className="text-destructive ml-2">
                  • {totalError} failed
                </span>
              )}
            </span>
            {totalPending > 0 && (
              <button
                onClick={uploadAll}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                Upload {totalPending} script{totalPending !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.barcode}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                {/* Icon */}
                {item.status === "pending" && (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                )}
                {item.status === "processing" && (
                  <Loader2 className="h-4 w-4 text-info animate-spin shrink-0" />
                )}
                {item.status === "done" && (
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.barcode}
                  </p>
                  {item.error && (
                    <p className="text-xs text-destructive truncate">
                      {item.error}
                    </p>
                  )}
                  {(item.status === "uploading" ||
                    item.status === "processing") && (
                    <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove */}
                {item.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.barcode);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
