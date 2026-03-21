import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { AwardResource } from '@/types/generated.d';
import { DollarSign, Edit, Eye, Gift } from 'lucide-react';
import { Link } from '@inertiajs/react';
import admin from '@/routes/admin';

interface AwardCardProps {
    award: AwardResource;
    showActions?: boolean;
    className?: string;
}

export default function AwardCard({ award, showActions = true, className = '' }: AwardCardProps) {
    
    

    return (
        <Card className={`h-full ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                                #{award.attributes.position}
                            </Badge>
                            <Badge variant={award.attributes.isMonetary ? 'default' : 'secondary'}>
                                {award.attributes.isMonetary ? t('models:award.monetary') : t('models:award.non_monetary')}
                            </Badge>
                            <Badge variant={award.attributes.isActive ? 'default' : 'secondary'}>
                                {award.attributes.isActive ? t('models:award.active') : t('models:award.inactive')}
                            </Badge>
                        </div>
                        <CardTitle className="text-lg leading-tight">{award.attributes.title}</CardTitle>
                        {award.attributes.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {award.attributes.description}
                            </p>
                        )}
                    </div>
                </div>
                
                {award.attributes.isMonetary && award.attributes.amount && (
                    <div className="flex items-center gap-1 text-lg font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(award.attributes.amount, award.attributes.currency)}
                    </div>
                )}
            </CardHeader>
            
            {showActions && (
                <CardContent className="pt-0">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={admin.awards.show.url({ award: award.id })}>
                                <Eye className="me-2 h-4 w-4" />
                                {t('common:view')}
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={admin.awards.edit.url({ award: award.id })}>
                                <Edit className="me-2 h-4 w-4" />
                                {t('common:edit')}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}