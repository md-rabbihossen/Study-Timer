import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { syncData } from '../services/supabase';

function TodoList({ fontColor, backgroundColor, onUpdate }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [dailyStats, setDailyStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    lastResetDate: new Date().toDateString(),
    lastPercentage: 0
  });

  const calculatePercentage = () => {
    if (dailyStats.totalTasks === 0) return 0;
    return Math.round((dailyStats.completedTasks / dailyStats.totalTasks) * 100);
  };

  useEffect(() => {
    syncData.getTodos().then(({ todos, dailyStats }) => {
      setTodos(todos);
      const today = new Date().toDateString();
      
      if (dailyStats.lastResetDate === today) {
        setDailyStats(dailyStats);
      } else {
        const newStats = {
          totalTasks: todos.length,
          completedTasks: 0,
          lastResetDate: today,
          lastPercentage: 0
        };
        setDailyStats(newStats);
        syncData.saveTodos(todos, newStats);
      }
    }).catch(error => {
      console.error('Error loading todos:', error);
    });

    const subscription = syncData.subscribeToTodos((newTodos) => {
      setTodos(newTodos);
      localStorage.setItem('todos', JSON.stringify(newTodos));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyStats.lastResetDate !== today) {
      setDailyStats({
        totalTasks: todos.length,
        completedTasks: 0,
        lastResetDate: today,
        lastPercentage: 0
      });
    }
  }, [todos]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const updatedTodos = [...todos, {
      id: uuidv4(),
      text: newTodo.trim(),
      completed: false
    }];

    const newTotal = updatedTodos.length;
    const currentPercentage = Math.round((dailyStats.completedTasks / newTotal) * 100);

    const newStats = {
      ...dailyStats,
      totalTasks: newTotal,
      lastPercentage: currentPercentage
    };

    setTodos(updatedTodos);
    setDailyStats(newStats);
    await syncData.saveTodos(updatedTodos, newStats);
    setNewTodo('');
  };

  const handleToggleTodo = async (id) => {
    try {
      const updatedTodos = todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );

      const completedCount = updatedTodos.filter(todo => todo.completed).length;
      const totalTasksCount = updatedTodos.length;
      const currentPercentage = Math.round((completedCount / totalTasksCount) * 100);

      const newStats = {
        ...dailyStats,
        completedTasks: completedCount,
        totalTasks: totalTasksCount,
        lastPercentage: currentPercentage
      };

      setTodos(updatedTodos);
      setDailyStats(newStats);
      await syncData.saveTodos(updatedTodos, newStats);
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
        <span>Completed {calculatePercentage()}%</span>
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