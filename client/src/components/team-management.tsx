import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Loader2, UserPlus, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SelectTeam } from "@db/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

const inviteMemberSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type CreateTeamForm = z.infer<typeof createTeamSchema>;
type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

interface TeamManagementProps {
  onTeamSelect?: (teamId: number | null) => void;
  selectedTeamId?: number | null;
}

export function TeamManagement({ onTeamSelect, selectedTeamId }: TeamManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: teams, isLoading } = useQuery<{ team: SelectTeam, role: string }[]>({
    queryKey: ["/api/teams"],
  });

  const createTeamForm = useForm<CreateTeamForm>({
    resolver: zodResolver(createTeamSchema),
  });

  const inviteMemberForm = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamForm) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Team created successfully" });
      setIsCreateOpen(false);
      createTeamForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (data: InviteMemberForm) => {
      const res = await apiRequest(
        "POST",
        `/api/teams/${selectedTeamId}/members`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Member invited successfully" });
      setIsInviteOpen(false);
      inviteMemberForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to invite member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading teams...
      </div>
    );
  }

  const selectedTeam = teams?.find((t) => t.team.id === selectedTeamId);
  const isOwner = selectedTeam?.role === "owner";

  return (
    <div className="flex items-center gap-4">
      <select
        className="rounded-md border px-3 py-2 text-sm"
        value={selectedTeamId || ""}
        onChange={(e) => onTeamSelect?.(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Personal Space</option>
        {teams?.map(({ team }) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCreateOpen(true)}
      >
        <Users className="h-4 w-4 mr-2" />
        New Team
      </Button>

      {selectedTeamId && isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsInviteOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <Form {...createTeamForm}>
            <form
              onSubmit={createTeamForm.handleSubmit((data) =>
                createTeamMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={createTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={createTeamMutation.isPending}
                className="w-full"
              >
                {createTeamMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Team
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <Form {...inviteMemberForm}>
            <form
              onSubmit={inviteMemberForm.handleSubmit((data) =>
                inviteMemberMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={inviteMemberForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter username to invite" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={inviteMemberMutation.isPending}
                className="w-full"
              >
                {inviteMemberMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
