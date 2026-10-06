import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

type Props = {
    name: string;
    price: number;
    onClick?: () => void;
}

export function ComponentCard({
    name,
    price,
    onClick
}: Props) {
    return (
        <Card className="flex flex-col justify-between h-full min-h-[180px]">
            <CardHeader className="flex-1 pb-4">
                <CardTitle className="text-base font-medium leading-tight">{name}</CardTitle>
                <CardDescription className="text-sm font-medium tabular-nums">
                    { new Intl.NumberFormat('ru-RU').format(price) }
                </CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
                <Button
                    variant="secondary"
                    size="sm"
                    className="w-full gap-1.5 cursor-pointer bg-red-500 text-white hover:bg-red-600 border-none"
                    onClick={onClick}
                >
                    Добавить
                </Button>
            </CardFooter>
        </Card> 
    )
}