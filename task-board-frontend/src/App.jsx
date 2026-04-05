import { useEffect, useState } from 'react';
import { supabase, getOrCreateUser } from './supabase';
import axios from 'axios';
import { Layout, Plus, Loader2 } from 'lucide-react';
import './App.css';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' }
];

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState('todo');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'normal' });
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', priority: '' });
  const handleViewDetails = async (taskId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tasks/${taskId}`);
      setSelectedTask(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error("Fetch details failed:", err);
      alert("Could not load task details.");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
  
    try {
      await axios.post(`${API_BASE_URL}/api/tasks/${taskId}/delete`);
      setTasks(prev => prev.filter(t => t.id !== taskId)); 
      setIsViewModalOpen(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };
  const handleSaveEdit = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/tasks/${selectedTask.id}/update`, editData);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? res.data : t));
      setSelectedTask(res.data); 
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/tasks`, {
        ...newTask,
        userId: userId,
        status: activeColumn 
      });
      
      setTasks(prev => [...prev, res.data]); 
      setIsModalOpen(false); 
      setNewTask({ title: '', description: '', priority: 'normal' }); 
    } catch (err) {
      console.error("Create task failed:", err);
      alert("Could not create task. Please try again.");
    }
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        const id = await getOrCreateUser(); 
        if (id) {
          setUserId(id);
          const res = await axios.get(`${API_BASE_URL}/api/tasks/user/${id}`);
          setTasks(res.data);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="animate-spin" size={40} />
        <p>Loading your board...</p>
      </div>
    );
  }

    const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 border-red-200 text-red-700 shadow-sm';
      case 'NORMAL':
        return 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm';
      case 'LOW':
        return 'bg-slate-100 border-slate-200 text-slate-600 shadow-sm';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return; 
    }


    const movedTask = tasks.find(t => t.id === draggableId);
    
    if (!movedTask){ 
      console.error("Task not found for ID:", draggableId);
      return;
    }

    const taskId = movedTask.id; 
    const updatedTask = { ...movedTask, status: destination.droppableId };

    const originalTasks = [...tasks]; 
    setTasks(prev =>
      prev.map(t => t.id === taskId ? updatedTask : t)
    );
    console.log(`Task ${taskId} moved from ${source.droppableId} to ${destination.droppableId}`);
    try {
      console.log("Syncing task update to server...", updatedTask);
      await axios.patch(`${API_BASE_URL}/api/tasks/${taskId}/status`, updatedTask);
      console.log("Task synced with database");
    } catch (err) {
      console.error("Failed to update task on server:", err);
      setTasks(originalTasks);
      alert("Sync failed. Rolling back changes.");
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <div className="logo-box">
              <Layout size={20} />
            </div>
            <h1 className="title">Team Task Board</h1>
          </div>
          <div className="user-id">
            Guest ID: {userId?.slice(0, 8)}
          </div>
        </header>

        {/* Board */}
        <main className="board">
          {COLUMNS.map(column => (
            <div key={column.id} className="column">
              <div className="column-header">
                <div className="column-title">
                  <h2>{column.title}</h2>
                  <span className="count">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                <button onClick={() => { setActiveColumn(column.id); setIsModalOpen(true); }} className="add-btn">
                  <Plus size={18} />
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="task-list"
                  >
                    {tasks
                      .filter(task => task.status === column.id)
                      .map((task, index) => (
                        <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                            >
                              <h3>{task.title}</h3>
                              <p>{task.description}</p>
                              <div className="flex justify-between items-center mt-4">
                                <div className="task-priority">{task.priority || 'NORMAL'}</div>
                                <button onClick={() => handleViewDetails(task.id)} className="px-4 py-1 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-all">
                                  Details
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </main>

        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 className="modal-title">
                New Task in {activeColumn.replace('_', ' ')}
              </h2>
              <form onSubmit={handleCreateTask} className="modal-form">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    autoFocus
                    required
                    value={newTask.title}
                    onChange={e =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={e =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <div className="flex gap-2">
                    {['LOW', 'NORMAL', 'URGENT'].map((p) => (
                      <button key={p} type="button"  onClick={() => setNewTask({ ...newTask, priority: p })} className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${ 
                        newTask.priority === p ? getPriorityStyle(p)  : 'border-slate-200 text-slate-500 hover:bg-slate-50' 
                      }`}>{p}
                      </button>
                    ))}
                  </div>
                </div>  
                <div className="modal-actions">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isViewModalOpen && selectedTask && (
  <div className="modal-overlay">
    <div className="modal max-w-lg w-full">
      <div className="flex justify-between mb-4">
        <h2 className="title">{isEditing ? "Edit Task: " : "Task Details: " + selectedTask.title}</h2>
        {!isEditing && (
          <h2 className="task-priority">
            {selectedTask.priority}
          </h2>
        )}
        <button onClick={() => { setIsViewModalOpen(false); setIsEditing(false); }}>✕</button>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <input 
            className="w-full p-2 border rounded"
            value={editData.title}
            onChange={e => setEditData({...editData, title: e.target.value})}
          />
          <textarea 
            className="w-full p-2 border rounded h-32"
            value={editData.description}
            onChange={e => setEditData({...editData, description: e.target.value})}
          />
          <div className="flex gap-2">
            {['LOW', 'NORMAL', 'URGENT'].map(p => (
              <button 
                key={p}
                onClick={() => setEditData({...editData, priority: p})}
                className={`flex-1 p-2 rounded border ${editData.priority === p ? 'bg-indigo-600 text-white' : 'bg-white'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-4">
          <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded">{selectedTask.description}</p>
          <div className="text-xs text-slate-400">Created: {new Date(selectedTask.createdAt).toLocaleString()}</div>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-3 pt-6 border-t">
        <button 
          onClick={() => handleDelete(selectedTask.id)}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
        >
          Delete Task
        </button>
        
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500">Cancel</button>
              <button onClick={handleSaveEdit} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold">Save Changes</button>
            </>
          ) : (
            <button 
              onClick={() => {
                setEditData({ title: selectedTask.title, description: selectedTask.description, priority: selectedTask.priority });
                setIsEditing(true);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
      )}
      </div>
    </DragDropContext>
  );
}

export default App;