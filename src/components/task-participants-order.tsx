"use client";

import { useState } from "react";
import { AvatarInitials } from "./avatar-initials";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Dices, GripVertical } from "lucide-react";
import confetti from "canvas-confetti";

type Member = { id: string; name: string; image: string | null };

function SortableMemberRow({ member, orderIndex }: { member: Member; orderIndex: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-[12px] border bg-surface-container-lowest ${
        isDragging ? "border-primary shadow-lg scale-[1.02]" : "border-outline-variant shadow-sm"
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="text-on-surface-variant hover:text-primary cursor-grab active:cursor-grabbing p-1"
      >
        <GripVertical size={18} />
      </div>
      
      <div className="w-6 h-6 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold">
        {orderIndex + 1}
      </div>

      <AvatarInitials name={member.name} imageUrl={member.image} size={32} />
      
      <span className="font-semibold text-sm flex-1">{member.name}</span>
    </div>
  );
}

export function TaskParticipantsOrder({
  members,
  selectedIds,
  onChange,
}: {
  members: Member[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [isSpinning, setIsSpinning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = selectedIds.indexOf(active.id as string);
      const newIndex = selectedIds.indexOf(over.id as string);
      onChange(arrayMove(selectedIds, oldIndex, newIndex));
    }
  };

  const handleRoulette = () => {
    if (selectedIds.length < 2) return;
    setIsSpinning(true);
    
    let iterations = 0;
    const maxIterations = 20;
    const interval = setInterval(() => {
      const shuffled = [...selectedIds].sort(() => Math.random() - 0.5);
      onChange(shuffled);
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setIsSpinning(false);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
        });
      }
    }, 100);
  };

  const selectedMembers = selectedIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as Member[];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          Orden de Turnos
        </p>
        <button
          type="button"
          onClick={handleRoulette}
          disabled={isSpinning || selectedIds.length < 2}
          className="flex items-center gap-1.5 text-[11px] font-bold bg-primary-container text-primary px-3 py-1.5 rounded-pill hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <Dices size={14} />
          Ruleta
        </button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={selectedIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {selectedMembers.map((m, i) => (
              <SortableMemberRow key={m.id} member={m} orderIndex={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <p className="text-[11px] text-on-surface-variant text-center">
        Arrastra para ordenar o usa la ruleta para decidir a la suerte.
      </p>
    </div>
  );
}
