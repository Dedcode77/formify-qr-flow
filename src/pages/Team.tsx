import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  Trash2, 
  Loader2,
  Mail,
  MoreVertical,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export default function Team() {
  const { user, organization, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Fetch organization members with their profiles
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organization.id);
      
      if (membersError) throw membersError;
      
      // Fetch profiles for each member
      const memberIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', memberIds);
      
      if (profilesError) throw profilesError;
      
      // Combine members with their profiles
      const membersWithProfiles: MemberWithProfile[] = membersData.map(member => ({
        ...member,
        profile: profilesData?.find(p => p.id === member.user_id) || null
      }));
      
      return membersWithProfiles;
    },
    enabled: !!organization?.id,
  });

  // Check if current user is admin
  const currentUserMember = members?.find(m => m.user_id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin' || organization?.owner_id === user?.id;
  const isOwner = organization?.owner_id === user?.id;

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Rôle mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Membre supprimé avec succès');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Erreur lors de la suppression du membre');
    },
  });

  // Fetch pending invitations
  const { data: pendingInvitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['pending-invitations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('organization_id', organization.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && isAdmin,
  });

  // Send invitation mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-team-invitation', {
        body: { 
          email, 
          role, 
          organizationId: organization?.id,
          organizationName: organization?.name 
        },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de l\'envoi');
      }

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation envoyée avec succès !');
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('user');
    },
    onError: (error: any) => {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'invitation');
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation annulée');
    },
    onError: (error) => {
      console.error('Error canceling invitation:', error);
      toast.error('Erreur lors de l\'annulation');
    },
  });

  // Invite member handler
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }
    
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    updateRoleMutation.mutate({ memberId, newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    removeMemberMutation.mutate(memberId);
  };

  const getRoleBadge = (role: string, isOwnerUser: boolean) => {
    if (isOwnerUser) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
          <Crown className="w-3 h-3 mr-1" />
          Propriétaire
        </Badge>
      );
    }
    
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Users className="w-3 h-3 mr-1" />
            Membre
          </Badge>
        );
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  if (isLoading || membersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Chargement de l'équipe...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Équipe</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les membres de votre organisation
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Inviter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inviter un nouveau membre</DialogTitle>
                  <DialogDescription>
                    Envoyez une invitation par email pour rejoindre votre organisation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Membre</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Les admins peuvent gérer les formulaires et les membres.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={inviteMutation.isPending}>
                    Annuler
                  </Button>
                  <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    {inviteMutation.isPending ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Membres</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {members?.filter(m => m.role === 'admin' || m.user_id === organization?.owner_id).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{organization?.plan || 'Free'}</p>
                  <p className="text-sm text-muted-foreground">Plan actuel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Membres de l'équipe</CardTitle>
            <CardDescription>
              {members?.length || 0} membre{(members?.length || 0) > 1 ? 's' : ''} dans votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members?.map((member, index) => {
                const memberIsOwner = member.user_id === organization?.owner_id;
                const canManage = isAdmin && !memberIsOwner && member.user_id !== user?.id;
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.profile?.full_name, member.profile?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.profile?.full_name || 'Utilisateur'}
                          {member.user_id === user?.id && (
                            <span className="text-muted-foreground ml-2">(vous)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profile?.email || 'Email non disponible'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role, memberIsOwner)}
                      
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Depuis {format(new Date(member.created_at), 'MMM yyyy', { locale: fr })}
                      </span>
                      
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(
                                member.id, 
                                member.role === 'admin' ? 'user' : 'admin'
                              )}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              {member.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {member.profile?.full_name || 'Ce membre'} sera retiré de l'organisation. 
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {(!members || members.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun membre dans l'organisation
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {isAdmin && pendingInvitations && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Invitations en attente
              </CardTitle>
              <CardDescription>
                {pendingInvitations.length} invitation{pendingInvitations.length > 1 ? 's' : ''} en attente de réponse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation, index) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invité le {format(new Date(invitation.created_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-primary/30">
                        {invitation.role === 'admin' ? 'Admin' : 'Membre'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Expire le {format(new Date(invitation.expires_at), 'dd MMM', { locale: fr })}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                        disabled={cancelInvitationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Accès limité
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Seuls les administrateurs peuvent inviter ou gérer les membres de l'équipe.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
