import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { BarLoader } from "react-spinners";
import { UserPlus, Trash2, Crown, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import {
  getCompanyMembers,
  addCompanyMember,
  updateCompanyMemberRole,
  removeCompanyMember,
} from "@/api/apiCompanies";

// "owner" isn't assignable from this UI — there's exactly one, set when the
// company is created, and it's synced into company_members below.
const ASSIGNABLE_ROLES = ["admin", "recruiter", "hiring_manager", "viewer"];

const ROLE_LABEL = {
  owner: "Owner",
  admin: "Admin",
  recruiter: "Recruiter",
  hiring_manager: "Hiring Manager",
  viewer: "Viewer",
};

const TeamTab = ({ company }) => {
  const { user } = useUser();
  const isOwner = Boolean(user?.id && company?.owner_id === user.id);
  const [inviteId, setInviteId] = useState("");
  const [inviteRole, setInviteRole] = useState("recruiter");
  const ownerSynced = useRef(false);

  const { data: members, loading, fn: fnMembers } = useFetch(getCompanyMembers, {
    company_id: company?.id,
  });
  const { fn: fnAdd, loading: adding, error: addError, data: addResult } = useFetch(
    addCompanyMember,
    { company_id: company?.id }
  );
  const { fn: fnRole } = useFetch(updateCompanyMemberRole);
  const { fn: fnRemove } = useFetch(removeCompanyMember);

  useEffect(() => {
    if (company?.id) fnMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // First time the owner opens this tab, make sure their own row exists in
  // company_members with role "owner" — so the team list is a complete,
  // single source of truth instead of the owner being an invisible implicit
  // member. Safe to call repeatedly: unique(company_id, user_id) means a
  // second attempt just comes back as "already a member".
  useEffect(() => {
    if (isOwner && company?.id && user?.id && !ownerSynced.current) {
      ownerSynced.current = true;
      fnAdd({ user_id: user.id, role: "owner" }).finally(() => fnMembers());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, company?.id, user?.id]);

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    await fnAdd({ user_id: inviteId.trim(), role: inviteRole });
    setInviteId("");
    fnMembers();
  };

  const handleRoleChange = async (memberId, role) => {
    await fnRole({ member_id: memberId }, { role });
    fnMembers();
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this team member's access?")) return;
    await fnRemove({ member_id: memberId });
    fnMembers();
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-sm font-semibold">Team Members</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          People who can help manage this company and its job postings.
        </p>
      </div>

      {!isOwner && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-border bg-surface-2/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Only the company owner can invite, change roles, or remove members. You can see your own membership below.
        </div>
      )}

      {isOwner && (
        <div className="hairline mb-6 rounded-lg bg-surface-2/40 p-4">
          <Label>Invite by Clerk user ID</Label>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">
            Ask your teammate for their Clerk user ID (visible in their own account settings) — email-based invites
            aren't wired up yet.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="user_2abc..."
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
              className="sm:flex-1"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button type="button" onClick={handleInvite} disabled={adding || !inviteId.trim()} className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </Button>
          </div>
          {addResult?.alreadyMember && (
            <p className="mt-2 text-xs text-warning">That user is already on the team.</p>
          )}
          {addError && <p className="mt-2 text-xs text-destructive">{addError.message}</p>}
        </div>
      )}

      {(loading !== false || adding) && <BarLoader width={"100%"} color="#7c5cff" />}

      {loading === false && (
        <div className="hairline overflow-hidden rounded-lg">
          {members?.length ? (
            members.map((m) => {
              const isMemberOwner = m.role === "owner";
              const isSelf = m.user_id === user?.id;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 border-b border-border/40 bg-surface-2/20 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {isMemberOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-warning" />}
                      <span className="truncate">{m.user_id}</span>
                      {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(m.joined_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isOwner && !isMemberOwner ? (
                      <Select value={m.role} onValueChange={(role) => handleRoleChange(m.id, role)}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs">
                        {ROLE_LABEL[m.role] || m.role}
                      </span>
                    )}

                    {isOwner && !isMemberOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No team members yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamTab;