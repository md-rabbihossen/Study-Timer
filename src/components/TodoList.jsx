import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { syncData } from '../services/supabase';

function TodoList({ fontColor, backgroundColor, onUpdate }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [totalDayTasks, setTotalDayTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  useEffect(() => {
    // Initial load
    syncData.getTodos().then((todos) => {
      setTodos(todos);
      setTotalDayTasks(todos.length);
      setCompletedTasks(todos.filter(todo => todo.completed).length);
    });

    // Subscribe to changes
    const subscription = syncData.subscribeToTodos((newTodos) => {
      setTodos(newTodos);
      localStorage.setItem('todos', JSON.stringify(newTodos));
    });

    // Reset at midnight
    const resetPercentageAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
      setTimeout(() => {
        setTotalDayTasks(todos.length);
        resetPercentageAtMidnight();
      }, msUntilMidnight);
    };
    resetPercentageAtMidnight();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculatePercentage = () => {
    if (totalDayTasks === 0) return 0;
    return Math.round((completedTasks / totalDayTasks) * 100);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const updatedTodos = [...todos, {
      id: uuidv4(),
      text: newTodo.trim(),
      completed: false
    }];

    setTodos(updatedTodos);
    setTotalDayTasks(prev => prev + 1);
    await syncData.saveTodos(updatedTodos);
    setNewTodo('');
  };

  const handleToggleTodo = async (id) => {
    try {
      // First update the local state
      const updatedTodos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      
      setTodos(updatedTodos);
      // Update completed tasks count
      setCompletedTasks(updatedTodos.filter(todo => todo.completed).length);
      
      // Save to database
      await syncData.saveTodos(updatedTodos);

      // After 500ms, remove completed tasks
      setTimeout(async () => {
        const filteredTodos = updatedTodos.filter(todo => !todo.completed);
        setTodos(filteredTodos);
        setTotalDayTasks(filteredTodos.length); // Update total tasks count
        setCompletedTasks(0); // Reset completed tasks count
        await syncData.saveTodos(filteredTodos);
      }, 500);
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
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
      
      <div className="todo-progress" style={{ color: fontColor }}>
        <span>{calculatePercentage()}% Complete</span>
        <div 
          className="progress-bar" 
          style={{ 
            backgroundColor: fontColor,
            width: `${calculatePercentage()}%`,
            height: '4px',
            borderRadius: '2px',
            marginTop: '4px',
            transition: 'width 0.3s ease'
          }} 
        />
      </div>
      
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
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                  style={{ borderColor: fontColor }}
                >
                  <label className="todo-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                      className="todo-checkbox"
                    />
                    <span className="todo-text">{todo.text}</span>
                  </label>
                </li>
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