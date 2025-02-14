import React, { useState, useRef } from "react";
import "./index.css"; // Импортируем файл со стилями

// Определение интерфейса для ячейки таблицы
interface Cell {
  id: string;
  value: string;
  type: "number" | "percent" | "name" | "text";
  rowspan?: number; // Количество строк, которые занимает ячейка
  colspan?: number; // Количество столбцов, которые занимают ячейка
}

// Исходные данные для таблицы
const initialData: Cell[][] = [
  [
    { id: "header1", value: "30 января 2024", type: "text" },
    { id: "header2", value: "Смена 2", type: "text" },
    { id: "header3", value: "Мастер: Иванов И.И.", type: "name", colspan: 3 },
    { id: "header4", value: "РПТКМ-120", type: "text" },
  ],
  [
    { id: "cell1-1", value: "Персонал", type: "text" },
    { id: "cell1-2", value: "100500 человек", type: "text", colspan: 4 },
    { id: "cell1-3", value: "Комментарий в 3-5 строчек, который тоже можно редактировать.", type: "text", rowspan: 3 },
  ],
  [
    { id: "cell2-1", value: "КТП 2000 321", type: "text", rowspan: 2 },
    { id: "cell2-2", value: "Работает", type: "text", colspan: 2 },
    { id: "cell2-3", value: "24", type: "number" },
    { id: "cell2-4", value: "SPI 3432", type: "text" },
  ],
  [
    { id: "cell3-1", value: "98.4%", type: "percent" },
    { id: "cell3-2", value: "Функционирует, но не бьет", type: "text", colspan: 3 },
  ],
];

const EditableTable: React.FC = () => {
  const [data, setData] = useState<Cell[][]>(initialData);
  const [editedCells, setEditedCells] = useState<{ [key: string]: string }>({});
  const [progress, setProgress] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для сравнения текущего значения с исходным
  const isValueChanged = (rowIndex: number, colIndex: number, newValue: string): boolean => {
    const initialValue = initialData[rowIndex][colIndex].value;

    // Для ячейки "Мастер: Иванов И.И." сравниваем только редактируемую часть
    if (data[rowIndex][colIndex].id === "header3") {
      const initialName = initialValue.split(":")[1]?.trim() || "";
      return newValue.trim() !== initialName;
    }

    // Для остальных ячеек просто сравниваем значения
    return newValue.trim() !== initialValue.trim();
  };

  // Обработчик изменения значения ячейки
  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const cellId = data[rowIndex][colIndex].id;

    // Применяем валидацию
    let updatedValue = validateInput(data[rowIndex][colIndex].type, value);

    // Если это ячейка "Мастер: Иванов И.И."
    if (cellId === "header3") {
      updatedValue = `Мастер: ${updatedValue}`;
    }

    // Если значение не изменилось относительно начального, ничего не делаем
    if (!isValueChanged(rowIndex, colIndex, updatedValue)) {
      delete editedCells[cellId];
      setEditedCells({ ...editedCells });
      return;
    }

    // Обновляем данные в состоянии
    const newData = [...data];
    newData[rowIndex][colIndex].value = updatedValue;
    setData(newData);

    // Добавляем измененную ячейку в список отредактированных
    setEditedCells((prev) => ({ ...prev, [cellId]: updatedValue }));

    // Сбрасываем таймер, если он уже запущен
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      setProgress(0);
      setTimerActive(false);
    }

    // Запускаем новый таймер через 5 секунд
    timerRef.current = setTimeout(() => {
      setTimerActive(true);
      let currentProgress = 0;
      const interval = setInterval(() => {
        if (currentProgress >= 100) {
          clearInterval(interval);
          console.log("Отправленные изменения:", editedCells); // Выводим измененные ячейки
          setTimerActive(false);
          setProgress(0);
          setEditedCells({});
        } else {
          setProgress(currentProgress + 10);
          currentProgress += 10;
        }
      }, 1000);
    }, 5000);
  };

  // Валидация вводимых данных
  const validateInput = (type: Cell["type"], value: string): string => {
    switch (type) {
      case "number":
        return value.replace(/[^0-9.]/g, ""); // Только цифры и точка
      case "percent":
        { const numericPart = value.replace(/[^0-9.]/g, ""); // Убираем все, кроме цифр
        return `${numericPart}%`; } // Добавляем % в конце
      case "name":
        return value.replace(/[^а-яА-ЯёЁ.\s]/g, ""); // Разрешаем кириллицу, пробелы и точки
      default:
        return value;
    }
  };

  // Установка позиции курсора перед символом % (для onFocus)
  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.endsWith("%")) {
      const position = value.length - 1;
      e.target.setSelectionRange(position, position);
    }
  };

  // Установка позиции курсора перед символом % (для onClick)
  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const value = target.value;
    if (value.endsWith("%")) {
      const position = value.length - 1;
      target.setSelectionRange(position, position);
    }
  };

  return (
    <div className="table">
      <table className="editable-table">
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={cell.id}
                  className={rowIndex === 0 ? "header-cell" : "cell"}
                  rowSpan={cell.rowspan || 1}
                  colSpan={cell.colspan || 1}
                >
                  {/* Отдельная обработка для ячейки "Мастер: Иванов И.И." */}
                  {cell.id === "header3" ? (
                    <div className="master-cell">
                      <span className="master-label">Мастер:</span>{" "}
                      <textarea
                        value={cell.value.split(":")[1]?.trim() || ""}
                        onChange={(e) => {
                          const validatedValue = validateInput(cell.type, e.target.value);
                          handleCellChange(
                            rowIndex,
                            colIndex,
                            validatedValue
                          );
                        }}
                        className="textarea-cell master-textarea"
                        rows={1}                        
                      />
                    </div>
                  ) : (
                    <textarea
                      value={cell.value}
                      onChange={(e) => {
                        const validatedValue = validateInput(cell.type, e.target.value);
                        handleCellChange(rowIndex, colIndex, validatedValue);
                      }}
                      onFocus={handleFocus}
                      onClick={handleClick}
                      className={`textarea-cell ${cell.id === "cell3-2" ? "red-text" : ""}`}
                      rows={cell.id === "cell1-3" ? 3 : 1} // Устанавливаем количество строк для многострочного текста                     
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Прогресс-бар */}
      {Object.keys(editedCells).length > 0 && timerActive && (
        <div className="progress-bar-container">
          <div className="progress-text">Отправка данных через: {Math.ceil((100 - progress) / 10)} секунд</div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableTable;