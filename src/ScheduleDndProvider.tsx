import React, { useCallback, useState } from "react";
import { 
  DndContext,
  DragEndEvent,
  DragStartEvent,
  Modifier,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { CellSize, DAY_LABELS } from "./constants.ts";
import { useScheduleContext } from "./ScheduleContext.tsx";
import { Schedule } from "./types";

function createSnapModifier(): Modifier {
  return ({ transform, containerNodeRect, draggingNodeRect }) => {
    if (!containerNodeRect || !draggingNodeRect) return transform;

    const minX = containerNodeRect.left - draggingNodeRect.left + 120 + 1;
    const minY = containerNodeRect.top - draggingNodeRect.top + 40 + 1;
    const maxX = containerNodeRect.right - draggingNodeRect.right;
    const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      x: Math.min(
        Math.max(Math.round(transform.x / CellSize.WIDTH) * CellSize.WIDTH, minX),
        maxX
      ),
      y: Math.min(
        Math.max(Math.round(transform.y / CellSize.HEIGHT) * CellSize.HEIGHT, minY),
        maxY
      ),
    };
  };
}

const modifiers = [createSnapModifier()]

interface DndState {
  activeTableId: string | null;
}

type DndProviderChildren = 
  | React.ReactNode
  | ((props: DndState) => React.ReactNode);

interface ScheduleDndProviderProps {
  children: DndProviderChildren;
}

export default function ScheduleDndProvider({ children }: ScheduleDndProviderProps) {
  const { schedulesMap, setSchedulesMap } = useScheduleContext();

  // 현재 드래그 중인 tableId
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // 마우스 클릭 후 8px 이동해야 dragStart로 간주
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // 드래그 시작 시 어떤 tableId인지 파악
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const [tableId] = String(event.active.id).split(":");
    setActiveTableId(tableId);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // 드래그 끝날 때만 schedulesMap 업데이트
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      if (!active) return;

      const [tableId, index] = String(active.id).split(":");
      const scheduleList = schedulesMap[tableId];
      if (!scheduleList) return;

      // 위치 계산 로직 (x, y -> dayIndex, timeIndex)
      const moveDayIndex = Math.floor(delta.x / CellSize.WIDTH);
      const moveTimeIndex = Math.floor(delta.y / CellSize.HEIGHT);

      // drop 시점에만 전역 state 업데이트
      setSchedulesMap((prev) => {
        const newArr = prev[tableId].map((item, i) => {
          if (i !== Number(index)) return item;
          const nowDayIndex = DAY_LABELS.indexOf(item.day as typeof DAY_LABELS[number]);
          return {
            ...item,
            day: DAY_LABELS[nowDayIndex + moveDayIndex],
            range: item.range.map((time) => time + moveTimeIndex),
          } as Schedule;
        });
        return {
          ...prev,
          [tableId]: newArr,
        };
      });

      // 드래그 완료 후 activeTableId 해제
      setActiveTableId(null);
    },
    [schedulesMap, setSchedulesMap]
  );

  const renderChildren = () => {
    if (typeof children === "function") {
      // children이 함수이면, DndState를 인자로 호출
      const fn = children as (props: DndState) => React.ReactNode;
      return fn({ activeTableId });
    } else {
      // 그렇지 않으면 일반 Node로 렌더
      return children;
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd} 
      modifiers={modifiers}
    >
      {renderChildren()}
      <DragOverlay></DragOverlay>
    </DndContext>
  );
}
