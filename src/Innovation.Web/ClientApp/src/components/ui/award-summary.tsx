import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/formatters';
import { AwardResource } from '@/types/generated.d';
import { Award, DollarSign, Gift, TrendingUp } from 'lucide-react';

interface AwardSummaryProps {
    awards: AwardResource[];
    title?: string;
    className?: string;
    showDetails?: boolean;
}

export default function AwardSummary({ awards, title, className = '', showDetails = true }: AwardSummaryProps) {
    
    

    const totalAwards = awards.length;
    const monetaryAwards = awards.filter(award => award.attributes.isMonetary);
    const nonMonetaryAwards = awards.filter(award => !award.attributes.isMonetary);
    
    const totalValue = monetaryAwards.reduce((sum, award) => {
        return sum + (award.attributes.amount || 0);
    }, 0);

    const averageValue = totalValue / Math.max(monetaryAwards.length, 1);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    {title || t('models:award.summary')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overview Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{totalAwards}</div>
                        <div className="text-sm text-muted-foreground">{t('models:award.total')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{monetaryAwards.length}</div>
                        <div className="text-sm text-muted-foreground">{t('models:award.monetary')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{nonMonetaryAwards.length}</div>
                        <div className="text-sm text-muted-foreground">{t('models:award.non_monetary')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalValue)}</div>
                        <div className="text-sm text-muted-foreground">{t('models:award.total_value')}</div>
                    </div>
                </div>

                {showDetails && awards.length > 0 && (
                    <>
                        {/* Value Breakdown */}
                        {monetaryAwards.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-sm font-medium">
                                    <DollarSign className="h-4 w-4" />
                                    {t('models:award.value_breakdown')}
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                    <div>Average: {formatCurrency(averageValue)}</div>
                                    <div>Range: {formatCurrency(Math.min(...monetaryAwards.map(a => a.attributes.amount || 0)))} - {formatCurrency(Math.max(...monetaryAwards.map(a => a.attributes.amount || 0)))}</div>
                                </div>
                            </div>
                        )}

                        {/* Top Awards */}
                        <div className="space-y-2">
                            <h4 className="flex items-center gap-2 text-sm font-medium">
                                <TrendingUp className="h-4 w-4" />
                                {t('models:award.top_positions')}
                            </h4>
                            <div className="space-y-1">
                                {awards
                                    .sort((a, b) => a.attributes.position - b.attributes.position)
                                    .slice(0, 3)
                                    .map((award) => (
                                        <div key={award.id} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono">
                                                    #{award.attributes.position}
                                                </Badge>
                                                <span>{award.attributes.title}</span>
                                            </div>
                                            {award.attributes.isMonetary && award.attributes.amount ? (
                                                <span className="font-mono text-muted-foreground">
                                                    {formatCurrency(award.attributes.amount, award.attributes.currency)}
                                                </span>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Gift className="mr-1 h-3 w-3" />
                                                    Non-monetary
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>

                    </>
                )}
            </CardContent>
        </Card>
    );
}