import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { syncData } from '../services/supabase';

function TodoList({ fontColor, backgroundColor, onUpdate }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Initial load
    syncData.getTodos().then(setTodos);

    // Subscribe to changes
    const subscription = syncData.subscribeToTodos((newTodos) => {
      setTodos(newTodos);
      localStorage.setItem('todos', JSON.stringify(newTodos));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const updatedTodos = [...todos, {
      id: uuidv4(),
      text: newTodo.trim(),
      completed: false
    }];

    setTodos(updatedTodos);
    await syncData.saveTodos(updatedTodos);
    setNewTodo('');
  };

  const handleToggleTodo = async (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    
    setTodos(updatedTodos);
    await syncData.saveTodos(updatedTodos);

    setTimeout(async () => {
      const filteredTodos = updatedTodos.filter(todo => !todo.completed);
      setTodos(filteredTodos);
      await syncData.saveTodos(filteredTodos);
    }, 500);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTodos(items);
    localStorage.setItem('todos', JSON.stringify(items));
  };

  return (
    <div 
      className="todo-container" 
      style={{ 
        color: fontColor,
        borderColor: fontColor
      }}
    >
      <h2 className="todo-title">To Do</h2>
      
      <form 
        onSubmit={handleAddTodo} 
        className="todo-form"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
          }
        }}
      >
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a task..."
          className="todo-input"
          style={{ color: fontColor }}
        />
        <button 
          type="submit" 
          className="todo-add-btn"
          style={{ color: fontColor }}
        >
          <i className="fas fa-plus"></i>
        </button>
      </form>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="todos" type="TASK">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="todo-list"
            >
              {todos.map((todo, index) => (
                <Draggable 
                  key={todo.id} 
                  draggableId={todo.id} 
                  index={index}
                  type="TASK"
                >
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`todo-item ${snapshot.isDragging ? 'dragging' : ''} ${
                        todo.completed ? 'completed' : ''
                      }`}
                      style={{ 
                        ...provided.draggableProps.style,
                        borderColor: fontColor,
                        color: fontColor
                      }}
                    >
                      <label className="todo-checkbox-container">
                        <label className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo.id)}
                          />
                          <span 
                            className="checkmark" 
                            style={{ 
                              borderColor: fontColor,
                              backgroundColor: todo.completed ? backgroundColor : 'transparent'
                            }}
                          />
                        </label>
                        <span className="todo-text">{todo.text}</span>
                      </label>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default TodoList; 