'use client'

import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Component } from "@/lib/types";
import { useEffect, useState } from "react";
import { ComponentCard } from "./component-card";
import { getComponentsByCategory } from "../actions";

type Props = {
    categoryId: string;
    categoryName: string;
    onSelect: (component: Component) => void
}

export function AddComponentDialogContent({
    categoryId,
    categoryName,
    onSelect
}: Props) {
    const [components, setComponents] = useState<Component[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getComponentsByCategory(categoryId)
            .then(
                (data) => {
                    setComponents(data)
                    setLoading(false)
             })
    }, [categoryId])

    return (
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
                <DialogTitle>Добавить компонент - {categoryName}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto mx-1 px-4">
                {
                    components.length > 0 ? (
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {
                                components.map((c) => (
                                    <ComponentCard
                                        key={c.id}
                                        name={c.name}
                                        price={c.price}
                                        onClick={() => onSelect(c)}
                                    />
                                ))
                            }
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm py-4">
                            { loading ? 'Загрузка' : 'Нет доступных компонентов'}
                        </p>
                    )
                }
            </div>
        </DialogContent>
    )
}