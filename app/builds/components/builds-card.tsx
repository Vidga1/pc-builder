'use client '
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { Pencil } from "lucide-react";
import Link from "next/link";

type BuildCard = {
    user: {
        email: string;
    };
    id: string;
    name: string;
    totalPrice: number;
    createdAt: Date | null;
    components: Array<{
        id: string;
        component: {
            name: string
        }
    }>
}

type Props = {
    build: BuildCard,
    children?: React.ReactNode
}

export function BuildCard({
    build,
    children
}: Props) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div className="min-w-0 flex flex-col gap-1">
                    <CardTitle className="truncate">
                        <TypographyH3>{build.name}</TypographyH3>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                        Создал: { build.user?.email?.trim() || "Аноним"}
                    </p>
                </div>
                <div className="shrink-0">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <Link href={`/builds/${build.id}/edit`}><Pencil className="h-4 w-4"/></Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0 space-y-1 gap-2">
                {
                    build.components.length && (
                        <>
                        <p className="text-sm font-medium mt-2">Компоненты:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                {
                                    build.components.map(bc => (
                                        <li key={bc.id} className="truncate">{bc.component.name}</li>
                                    ))
                                }
                        </ul>
                       </>
                    )
                }
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4 border-t border-border/50 mt-auto">
                <div className="flex w-full justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-sky-500 text-xl font-bold tabular-nums">
                            {new Intl.NumberFormat('ru-Ru').format(build.totalPrice)} ₽
                        </span>
                        {
                            build.createdAt && (
                                <p className="text-xs text-muted-foreground">{
                                    new Intl.DateTimeFormat('ru-Ru').format(build.createdAt)
                                }</p>
                            )
                        }
                    </div>
                    <div className="flex items-center gap-2">
                        { children }
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}