import { type PaginatedResponse } from '@/hooks/use-api-pagination';
import { type IChallengeListResponse, ChallengeStatus, ChallengeDifficulty } from '@/types/generated';
import { challengeDefaultOrderBy, sortOption, type ChallengeField } from '@/types/filters';
import { useEnumOptions } from '@/hooks/use-enum-options';
import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataTable } from '@/components/ui/data-table';
import { SearchAndFilter } from '@/components/ui/search-and-filter';
import { usePagination } from '@/hooks/use-pagination';
import AdminLayout from '@/layouts/admin-layout';
import { getChallengeDifficultyColor, getChallengeStatusVariant, useChallengeDifficultyLabel, useChallengeStatusLabel } from '@/lib/enums/challenge';
import * as admin from '@/routes/admin';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, Edit, Eye, MapPin, Plus, Trophy, Users } from 'lucide-react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface Props extends SharedData {
    challenges: PaginatedResponse<IChallengeListResponse> | null;
}

export default function ChallengesIndex({ challenges }: Props) {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useQueryState('viewMode', parseAsStringLiteral(['list', 'grid'] as const).withDefault('list'));

    const getStatusLabel = useChallengeStatusLabel();
    const getDifficultyLabel = useChallengeDifficultyLabel();

    const pagination = usePagination<ChallengeField>({
        defaultOrderBy: challengeDefaultOrderBy,
        defaultPageSize: 15,
    });

    const statusOptions = useEnumOptions(ChallengeStatus, getStatusLabel);
    const difficultyOptions = useEnumOptions(ChallengeDifficulty, getDifficultyLabel);

    const sortOptions = [
        sortOption<ChallengeField>('createdAt', 'desc', t('common:newest')),
        sortOption<ChallengeField>('createdAt', 'asc', t('common:oldest')),
        sortOption<ChallengeField>('title', 'asc', t('common:title_az')),
        sortOption<ChallengeField>('title', 'desc', t('common:title_za')),
        sortOption<ChallengeField>('startDate', 'asc', t('common:start_date_asc')),
        sortOption<ChallengeField>('startDate', 'desc', t('common:start_date_desc')),
    ];

    const breadcrumbs = [
        { title: t('navigation:admin'), href: '#' },
        { title: t('navigation:challenges'), href: admin.challenges.index.url() },
    ];

    const columns: ColumnDef<IChallengeListResponse>[] = useMemo(
        () => [
            {
                accessorKey: 'title',
                header: t('models:challenge.title'),
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1">
                        <div className="font-sans font-medium text-primary">{row.original.title}</div>
                        <div className="font-sans text-sm text-primary/70">{row.original.organizer}</div>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: t('models:challenge.status'),
                cell: ({ row }) => {
                    const status = row.original.status as unknown as ChallengeStatus;
                    return <Badge variant={getChallengeStatusVariant(status)}>{getStatusLabel(status)}</Badge>;
                },
            },
            {
                accessorKey: 'difficulty',
                header: t('models:challenge.difficulty'),
                cell: ({ row }) => {
                    const difficulty = row.original.difficulty as unknown as ChallengeDifficulty;
                    return (
                        <Badge variant="outline" className={`border-${getChallengeDifficultyColor(difficulty)}-200 text-${getChallengeDifficultyColor(difficulty)}-800`}>
                            {getDifficultyLabel(difficulty)}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'startDate',
                header: t('models:challenge.start_date'),
                cell: ({ row }) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : '-',
            },
            {
                accessorKey: 'endDate',
                header: t('models:challenge.end_date'),
                cell: ({ row }) => row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : '-',
            },
            {
                accessorKey: 'maxParticipants',
                header: t('models:challenge.max_participants'),
                cell: ({ row }) => row.original.maxParticipants || '-',
            },
            {
                accessorKey: 'featured',
                header: t('models:challenge.featured'),
                cell: ({ row }) => row.original.featured ? <Trophy className="h-4 w-4 text-accent" /> : '-',
            },
            {
                id: 'actions',
                header: t('common:actions'),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={admin.challenges.show.url({ id: row.original.id })}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                            <Link href={admin.challenges.edit.url({ id: row.original.id })}><Edit className="h-4 w-4" /></Link>
                        </Button>
                    </div>
                ),
            },
        ],
        [t, getStatusLabel, getDifficultyLabel],
    );

    const renderGridItem = (challenge: IChallengeListResponse) => (
        <Card className="h-full border bg-muted/50 border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h3 className="font-heading leading-none font-semibold tracking-tight text-primary">{challenge.title}</h3>
                        <div className="flex gap-2">
                            <Badge variant={getChallengeStatusVariant(challenge.status as unknown as ChallengeStatus)}>
                                {getStatusLabel(challenge.status as unknown as ChallengeStatus)}
                            </Badge>
                            {challenge.difficulty && (
                                <Badge variant="outline" className={`border-${getChallengeDifficultyColor(challenge.difficulty as unknown as ChallengeDifficulty)}-200 text-${getChallengeDifficultyColor(challenge.difficulty as unknown as ChallengeDifficulty)}-800`}>
                                    {getDifficultyLabel(challenge.difficulty as unknown as ChallengeDifficulty)}
                                </Badge>
                            )}
                            {challenge.featured && (
                                <Badge variant="secondary" className="border-0 bg-muted text-accent">
                                    <Trophy className="mr-1 h-3 w-3 text-accent" />
                                    {t('models:challenge.featured')}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="space-y-1 font-sans text-sm text-primary/70">
                    <div className="flex items-center gap-1"><Users className="h-3 w-3 text-secondary" />{challenge.organizer}</div>
                    {challenge.startDate && <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-secondary" />{new Date(challenge.startDate).toLocaleDateString()}</div>}
                    {challenge.maxParticipants && <div className="flex items-center gap-1"><Users className="h-3 w-3 text-secondary" />{t('models:challenge.max_participants')}: {challenge.maxParticipants}</div>}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 font-sans" asChild>
                        <Link href={admin.challenges.show.url({ id: challenge.id })}><Eye className="me-2 h-4 w-4" />{t('common:view')}</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 font-sans" asChild>
                        <Link href={admin.challenges.edit.url({ id: challenge.id })}><Edit className="me-2 h-4 w-4" />{t('common:edit')}</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={t('navigation:challenges')} />

            <div className="container mx-auto space-y-6 p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="font-sans text-sm font-medium text-primary">{t('models:challenge.total')}</div>
                            <Calendar className="h-4 w-4 text-secondary" />
                        </CardHeader>
                        <CardContent><div className="font-heading text-2xl font-bold text-primary">{challenges?.totalCount ?? 0}</div></CardContent>
                    </Card>
                    <Card className="border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="font-sans text-sm font-medium text-primary">{getStatusLabel(ChallengeStatus.Open)}</div>
                            <Users className="h-4 w-4 text-secondary" />
                        </CardHeader>
                        <CardContent><div className="font-heading text-2xl font-bold text-primary">-</div></CardContent>
                    </Card>
                    <Card className="border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="font-sans text-sm font-medium text-primary">{getStatusLabel(ChallengeStatus.Draft)}</div>
                            <MapPin className="h-4 w-4 text-secondary" />
                        </CardHeader>
                        <CardContent><div className="font-heading text-2xl font-bold text-primary">-</div></CardContent>
                    </Card>
                    <Card className="border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="font-sans text-sm font-medium text-primary">{t('models:challenge.featured')}</div>
                            <Trophy className="h-4 w-4 text-accent" />
                        </CardHeader>
                        <CardContent><div className="font-heading text-2xl font-bold text-primary">-</div></CardContent>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">{t('navigation:challenges')}</h1>
                        <p className="font-sans text-primary/70">{t('models:challenge.description')}</p>
                    </div>
                    <Button asChild className="font-sans">
                        <Link href={admin.challenges.create.url()}><Plus className="mr-2 h-4 w-4" />{t('common:create')}</Link>
                    </Button>
                </div>

                {/* Search & Filter */}
                <SearchAndFilter
                    searchTerm={pagination.getFilter('title')}
                    onSearchChange={(term) => pagination.searchFilter('title', term)}
                    sortBy={pagination.orderBy}
                    onSortChange={pagination.sortBy}
                    sortOptions={sortOptions}
                    status={pagination.getFilter('status') || 'all'}
                    onStatusChange={(v) => pagination.enumFilter('status', v)}
                    statusOptions={statusOptions}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onResetFilters={pagination.clearFilter}
                    filterOptions={[{
                        key: 'difficulty',
                        label: t('models:challenge.difficulty'),
                        options: difficultyOptions,
                        value: pagination.getFilter('difficulty') || 'all',
                        onChange: (v) => pagination.enumFilter('difficulty', v),
                    }]}
                />

                {/* Data Display */}
                {viewMode === 'list' ? (
                    <DataTable
                        columns={columns}
                        data={challenges?.items ?? []}
                        pageCount={challenges?.totalPages ?? 1}
                        pageSize={challenges?.pageSize ?? 15}
                        currentPage={challenges?.page ?? 1}
                        totalItems={challenges?.totalCount ?? 0}
                        onPageChange={pagination.setPage}
                        onPageSizeChange={pagination.setPerPage}
                    />
                ) : (
                    <DataGrid
                        data={challenges?.items ?? []}
                        renderItem={renderGridItem}
                        gridCols={{ default: 1, md: 2, lg: 3, xl: 4 }}
                        pageCount={challenges?.totalPages ?? 1}
                        currentPage={challenges?.page ?? 1}
                        pageSize={challenges?.pageSize ?? 15}
                        totalItems={challenges?.totalCount ?? 0}
                        onPageChange={pagination.setPage}
                        onPageSizeChange={pagination.setPerPage}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
