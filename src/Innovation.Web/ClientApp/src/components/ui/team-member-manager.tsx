
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, Trash2, Users } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export interface TeamMember {
    id?: string | number;
    member_name: string;
    member_type?: string;
    role?: string;
}

interface TeamMemberManagerProps {
    value?: TeamMember[];
    onChange?: (members: TeamMember[]) => void;
    className?: string;
    disabled?: boolean;
    title?: string;
    description?: string;
    maxMembers?: number;
}

const getMemberSchema = (t: (key: string) => string) => z.object({
    member_name: z.string().min(1, t('ui/team-member-manager:member_name_required')),
    member_type: z.string().optional(),
    role: z.string().optional(),
});

type MemberFormData = z.infer<ReturnType<typeof getMemberSchema>>;

const getMemberTypes = (t: (key: string) => string) => [
    { value: 'internal', label: t('ui/team-member-manager:types.internal') },
    { value: 'external', label: t('ui/team-member-manager:types.external') },
    { value: 'customer', label: t('ui/team-member-manager:types.customer') },
    { value: 'supplier', label: t('ui/team-member-manager:types.supplier') },
    { value: 'partner', label: t('ui/team-member-manager:types.partner') },
    { value: 'investor', label: t('ui/team-member-manager:types.investor') },
    { value: 'regulator', label: t('ui/team-member-manager:types.regulator') },
    { value: 'community', label: t('ui/team-member-manager:types.community') },
    { value: 'government', label: t('ui/team-member-manager:types.government') },
    { value: 'other', label: t('ui/team-member-manager:types.other') },
];

export function TeamMemberManager({
    value = [],
    onChange,
    className,
    disabled = false,
    title,
    description,
    maxMembers = 20,
}: TeamMemberManagerProps) {
    const { t } = useTranslation();
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

    const memberSchema = getMemberSchema(t);
    const MEMBER_TYPES = getMemberTypes(t);

    const form = useForm<MemberFormData>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            member_name: '',
            member_type: '',
            role: '',
        },
    });

    const handleAddMember = () => {
        if (value.length >= maxMembers) {
            console.error(`${t('ui/team-member-manager:cannot_add_more')} ${maxMembers} ${t('ui/team-member-manager:members')}`);
            return;
        }

        console.log('TeamMemberManager: Adding new team member');
        setEditingIndex(null);
        form.reset({
            member_name: '',
            member_type: '',
            role: '',
        });
        setIsSheetOpen(true);
    };

    const handleEditMember = (index: number) => {
        console.log('TeamMemberManager: Editing team member', { index, member: value[index] });
        setEditingIndex(index);
        const member = value[index];
        if (!member) return;
        form.reset({
            member_name: member.member_name,
            member_type: member.member_type || '',
            role: member.role || '',
        });
        setIsSheetOpen(true);
    };

    const handleDeleteMember = (index: number) => {
        console.log('TeamMemberManager: Deleting team member', { index, member: value[index] });
        const newMembers = [...value];
        newMembers.splice(index, 1);
        onChange?.(newMembers);
    };

    const handleSaveMember = (data: MemberFormData) => {
        console.log('TeamMemberManager: Saving team member', {
            data,
            editingIndex,
            isEditing: editingIndex !== null
        });

        const member: TeamMember = {
            // eslint-disable-next-line react-hooks/purity
            id: editingIndex !== null ? (value[editingIndex]?.id ?? `temp_${Date.now()}`) : `temp_${Date.now()}`,
            ...data,
        };

        const newMembers = [...value];

        if (editingIndex !== null) {
            // Update existing team member
            newMembers[editingIndex] = member;
        } else {
            // Add new team member
            newMembers.push(member);
        }

        onChange?.(newMembers);
        setIsSheetOpen(false);
        form.reset();
    };

    const renderMemberCard = (member: TeamMember, index: number) => (
        <Card key={member.id || index} className="relative">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">{member.member_name}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditMember(index)}
                            disabled={disabled}
                        >
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteMember(index)}
                            disabled={disabled}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    {member.member_type && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t('ui/team-member-manager:type')}:</span>
                            <Badge variant="outline" className="text-xs">
                                {MEMBER_TYPES.find(type => type.value === member.member_type)?.label || member.member_type}
                            </Badge>
                        </div>
                    )}

                    {member.role && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t('ui/team-member-manager:role')}:</span>
                            <span className="text-xs">{member.role}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{title || t('ui/team-member-manager:title')}</h3>
                    <p className="text-sm text-muted-foreground">{description || t('ui/team-member-manager:description')}</p>
                </div>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button
                            onClick={handleAddMember}
                            disabled={disabled || value.length >= maxMembers}
                            size="sm"
                        >
                            <Plus className="h-4 w-4 me-2" />
                            {t('ui/team-member-manager:add_member')}
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>
                                {editingIndex !== null ? t('ui/team-member-manager:edit_member') : t('ui/team-member-manager:add_new_member')}
                            </SheetTitle>
                            <SheetDescription>
                                {t('ui/team-member-manager:member_form_description')}
                            </SheetDescription>
                        </SheetHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSaveMember)} className="space-y-4 mt-6">
                                <FormField
                                    control={form.control}
                                    name="member_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('ui/team-member-manager:member_name')} *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('ui/team-member-manager:member_name_placeholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="member_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('ui/team-member-manager:member_type')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('ui/team-member-manager:member_type_placeholder')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {MEMBER_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('ui/team-member-manager:role')}</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder={t('ui/team-member-manager:role_placeholder')} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" className="flex-1">
                                        {editingIndex !== null ? t('ui/team-member-manager:save_changes') : t('ui/team-member-manager:add_member_button')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsSheetOpen(false)}
                                    >
                                        {t('ui/team-member-manager:cancel')}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Team Members List */}
            {value.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {value.map((member, index) =>
                        renderMemberCard(member, index)
                    )}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                                {t('ui/team-member-manager:no_members_added')}
                            </p>
                            <Button
                                onClick={handleAddMember}
                                disabled={disabled}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 me-2" />
                                {t('ui/team-member-manager:add_first_member')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary */}
            {value.length > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{value.length} {t('ui/team-member-manager:members_count')}</span>
                    <span>{t('ui/team-member-manager:max_limit')}: {maxMembers}</span>
                </div>
            )}
        </div>
    );
}

export default TeamMemberManager;
