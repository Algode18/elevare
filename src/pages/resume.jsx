import { useState, useRef } from "react";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import {
  FileText,
  UploadCloud,
  ExternalLink,
  Star,
  Pencil,
  Trash2,
  Check,
  X,
  Copy,
  Download,
  Search,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import useFetch from "@/hooks/use-fetch";
import useResumes from "@/hooks/use-resumes";
import {
  uploadResume,
  renameResume,
  setDefaultResume,
  deleteResume,
  replaceResumeFile,
  duplicateResume,
} from "@/api/apiResumes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// import AmbientOrbs from "@/components/ambient-orbs";

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? "Today" : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Floating stacked-sheets illustration — ambient, not literal. Sits behind
// the header at low opacity, per the workspace's "alive page" direction.
const FloatingSheets = () => (
  <svg
    viewBox="0 0 200 200"
    className="pointer-events-none absolute right-0 top-20 -z-10 h-32 w-32 opacity-25 sm:h-44 sm:w-44"
    aria-hidden="true"
  >
    <rect x="46" y="70" width="90" height="118" rx="10" className="fill-surface-2 stroke-border" strokeWidth="1.5" transform="rotate(-8 46 70)" />
    <rect x="58" y="52" width="90" height="118" rx="10" className="fill-surface-2 stroke-border" strokeWidth="1.5" transform="rotate(4 58 52)" />
    <rect x="52" y="40" width="90" height="118" rx="10" className="fill-elevated stroke-primary/30" strokeWidth="1.5" />
    <line x1="66" y1="60" x2="120" y2="60" className="stroke-primary/40" strokeWidth="3" strokeLinecap="round" />
    <line x1="66" y1="74" x2="128" y2="74" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
    <line x1="66" y1="88" x2="110" y2="88" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const StatBlock = ({ label, value }) => (
  <div>
    <div className="text-lg font-semibold sm:text-xl">{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

// The active/default resume — the hero of the page.
const HeroResume = ({ resume, onView, onDownload }) => (
  <div className="hairline relative flex min-h-[220px] flex-col justify-between rounded-[28px] bg-elevated p-6 sm:p-8">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-display text-2xl sm:text-3xl">{resume.title}</h2>
          <span className="animate-default-glow flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Star className="h-3 w-3" /> Default
          </span>
        </div>
        {resume.role && (
          <p className="mt-1 text-sm text-muted-foreground">{resume.role}</p>
        )}
      </div>
    </div>

    <div className="hairline my-5 border-t" />

    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <StatBlock label="Applications" value={resume.applications} />
      <StatBlock label="Interviews" value={resume.interviews} />
      <StatBlock label="Updated" value={timeAgo(resume.updated_at)} />

      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(resume)}>
          View
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDownload(resume)}>
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
    </div>
  </div>
);

const ResumeCard = ({ resume, index, user, refetch, onSetDefault, onView, onDownload }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(resume.title);
  const [role, setRole] = useState(resume.role || "");
  const fileInputRef = useRef(null);

  const { fn: fnRename, loading: renaming } = useFetch(renameResume, { user_id: user?.id });
  const { fn: fnDelete, loading: deleting } = useFetch(deleteResume, { user_id: user?.id });
  const { fn: fnReplace, loading: replacing } = useFetch(replaceResumeFile, { user_id: user?.id });
  const { fn: fnDuplicate, loading: duplicating } = useFetch(duplicateResume, { user_id: user?.id });

  const saveRename = async () => {
    await fnRename({ id: resume.id, title, role });
    await refetch();
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${resume.title}"? This can't be undone.`)) return;
    await fnDelete({ id: resume.id });
    await refetch();
  };

  const handleReplace = async (file) => {
    if (!file) return;
    await fnReplace({ id: resume.id, file });
    await refetch();
  };

  const handleDuplicate = async () => {
    await fnDuplicate({ resume });
    await refetch();
  };

  const busy = renaming || deleting || replacing || duplicating;

  return (
    <div
      className={cn(
        "hover-lift animate-in fade-in slide-in-from-bottom-2 group hairline relative flex min-h-[150px] w-full shrink-0 flex-col justify-between rounded-2xl bg-card p-3.5 hover:border-primary/40 sm:w-[220px]",
        resume.is_default && "ring-1 ring-primary/30"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => handleReplace(e.target.files?.[0])}
      />

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume name" className="h-7 text-sm" />
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="h-7 text-xs" />
        </div>
      ) : (
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-3.5 w-3.5" />
            </div>
            {resume.is_default && <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />}
          </div>
          <div className="mt-1.5 truncate text-sm font-medium">{resume.title}</div>
          {resume.role && <div className="truncate text-xs text-muted-foreground">{resume.role}</div>}
        </div>
      )}

      <div>
        {!editing && (
          <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{resume.applications} applications</span>
            <span>{timeAgo(resume.updated_at)}</span>
          </div>
        )}

        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={saveRename} disabled={busy} className="flex-1">
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
            <button onClick={() => onView(resume)} className="hairline rounded-md p-1.5 hover:border-primary/50" title="View">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDownload(resume)} className="hairline rounded-md p-1.5 hover:border-primary/50" title="Download">
              <Download className="h-3.5 w-3.5" />
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="hairline ml-auto rounded-md p-1.5 hover:border-primary/50" title="More">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 min-w-[160px] rounded-[var(--radius-dropdown)] border border-border bg-elevated p-1 shadow-[var(--shadow-3)]"
                >
                  <DropdownMenu.Item
                    onSelect={() => setEditing(true)}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-surface-2"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => fileInputRef.current?.click()}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-surface-2"
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Replace file
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={handleDuplicate}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-surface-2"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </DropdownMenu.Item>
                  {!resume.is_default && (
                    <DropdownMenu.Item
                      onSelect={() => onSetDefault(resume)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-surface-2"
                    >
                      <Star className="h-3.5 w-3.5" /> Make default
                    </DropdownMenu.Item>
                  )}
                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                  <DropdownMenu.Item
                    onSelect={handleDelete}
                    disabled={busy}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 outline-none hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
      </div>
    </div>
  );
};

const UploadCard = ({ onFile, uploading }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <label
      htmlFor="resume-upload"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex h-[150px] w-full shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-center transition-colors duration-200 sm:w-[220px]",
        dragOver ? "border-primary bg-primary/5" : "animate-dash-pulse"
      )}
    >
      <UploadCloud className={cn("h-6 w-6 transition-transform duration-200 group-hover:rotate-6", dragOver ? "text-primary" : "text-muted-foreground")} />
      <div className="text-sm font-medium">Upload Resume</div>
      <div className="text-xs text-muted-foreground">Drag or browse</div>
      <input
        id="resume-upload"
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {uploading && <BarLoader width={"60%"} color="var(--primary)" />}
    </label>
  );
};

const ActivityTimeline = ({ activity }) => {
  if (!activity.length) return null;

  const describe = (a) => {
    if (a.status === "applied") return `Applied to ${a.job_title || "a job"}${a.company_name ? ` at ${a.company_name}` : ""}`;
    if (a.status === "interviewing") return `Interview stage — ${a.job_title || "a job"}`;
    if (a.status === "hired") return `Hired — ${a.job_title || "a job"}`;
    if (a.status === "rejected") return `Not selected — ${a.job_title || "a job"}`;
    return `Applied to ${a.job_title || "a job"}`;
  };

  return (
    <div className="mt-10">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">Recent Activity</h3>
      <div className="relative pl-4">
        <div className="hairline absolute left-[3px] top-1 bottom-1 border-l" />
        {activity.map((a, i) => (
          <div key={i} className="relative mb-4 pl-4 last:mb-0">
            <div className="absolute -left-[3px] top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="text-sm">{describe(a)}</div>
            <div className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResumePage = () => {
  const { user, isLoaded } = useUser();
  const { resumes, defaultResume, recentActivity, loading: loadingResumes, refetch } = useResumes();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [pendingFile, setPendingFile] = useState(null);

  const { loading: uploading, error, fn: fnUpload } = useFetch(uploadResume, { user_id: user?.id });
  const { fn: fnSetDefault } = useFetch(setDefaultResume, { user_id: user?.id });

  const handleFile = async (file) => {
    if (!file) return;
    const okType = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);
    if (!okType) {
      alert("Only PDF or Word documents are allowed.");
      return;
    }
    setPendingFile(file);
    await fnUpload({ file, title: file.name.replace(/\.[^/.]+$/, ""), role: "" });
    await refetch();
    setPendingFile(null);
  };

  const handleSetDefault = async (resume) => {
    await fnSetDefault({ id: resume.id });
    await refetch();
  };

  const handleView = (resume) => window.open(resume.file_url, "_blank", "noreferrer");
  const handleDownload = (resume) => {
    const a = document.createElement("a");
    a.href = resume.file_url;
    a.download = resume.file_name || resume.title;
    a.click();
  };

  if (!isLoaded || loadingResumes) {
    return <BarLoader className="mb-4" width={"100%"} color="var(--primary)" />;
  }

  const filtered = resumes
    .filter((r) => {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || (r.role || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "most-used") return b.applications - a.applications;
      if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-2 py-2">
      {/* <AmbientOrbs /> */}
      <FloatingSheets />

      <div className="relative mb-8 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:text-left">
        <div>
          <h1 className="font-display text-4xl">Resume Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One place to manage every version of your career.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resumes..."
              className="h-8 w-full pl-8 text-sm sm:w-48"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger size="sm" className="w-[140px] shrink-0 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Latest</SelectItem>
              <SelectItem value="most-used">Most Used</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error?.message && <p className="mb-4 text-sm text-red-500">{error.message}</p>}

      {resumes.length === 0 ? (
        <div className="relative flex flex-col items-center gap-4">
          <div className="hairline flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-[28px] bg-elevated text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Your Resume Workspace is empty — upload your first resume to get started.
            </p>
          </div>
          <UploadCard onFile={handleFile} uploading={uploading || !!pendingFile} />
        </div>
      ) : (
        <>
          {defaultResume && (
            <HeroResume resume={defaultResume} onView={handleView} onDownload={handleDownload} />
          )}

          <h3 className="relative mb-4 mt-10 text-sm font-medium text-muted-foreground">
            Resume Collection
          </h3>
          <div className="scrollbar-none relative -mx-2 flex flex-col gap-4 px-2 pb-2 sm:-mx-2 sm:flex-row sm:overflow-x-auto sm:px-2">
            {filtered.map((r, i) => (
              <ResumeCard
                key={r.id}
                resume={r}
                index={i}
                user={user}
                refetch={refetch}
                onSetDefault={handleSetDefault}
                onView={handleView}
                onDownload={handleDownload}
              />
            ))}
            <UploadCard onFile={handleFile} uploading={uploading || !!pendingFile} />
          </div>

          <ActivityTimeline activity={recentActivity} />
        </>
      )}
    </div>
  );
};

export default ResumePage;