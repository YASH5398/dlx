import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ShareIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { useUser } from '../../context/UserContext';
import { firestore as db } from '../../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { toast } from 'react-toastify';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: React.ComponentType<any>;
  action: string;
  url?: string;
}

interface TaskCompletion {
  userId: string;
  taskId: string;
  amount: number;
  completedAt: any;
}

const DAILY_TASKS: Task[] = [
  {
    id: 'share_link',
    title: 'Share DigiLinex',
    description: 'Share DigiLinex with your friends on social media',
    reward: 2,
    icon: ShareIcon,
    action: 'Share Now',
    url: 'https://twitter.com/intent/tweet?text=Check%20out%20DigiLinex%20-%20Your%20Digital%20Solutions%20Partner!%20%23DigiLinex'
  },
  {
    id: 'follow_telegram',
    title: 'Join Telegram',
    description: 'Follow our official Telegram channel for updates',
    reward: 3,
    icon: ChatBubbleLeftRightIcon,
    action: 'Join Channel',
    url: 'https://t.me/digilinex'
  },
  {
    id: 'refer_friend',
    title: 'Refer a Friend',
    description: 'Invite friends using your referral link',
    reward: 5,
    icon: UserGroupIcon,
    action: 'Copy Link'
  },
  {
    id: 'daily_checkin',
    title: 'Daily Check-in',
    description: 'Visit your dashboard daily to maintain streak',
    reward: 1,
    icon: CheckCircleIcon,
    action: 'Check In'
  }
];

export default function Tasks() {
  const { user } = useUser();
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('inactive');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [processingTask, setProcessingTask] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserStatus();
      fetchCompletedTasks();
    }
  }, [user]);

  const fetchUserStatus = async () => {
    if (!user?.id) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user has any orders to determine active status
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.id)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const hasOrders = !ordersSnapshot.empty;
        const status = hasOrders ? 'active' : 'inactive';
        
        setUserStatus(status);
        
        // Update user status in Firestore if it's different
        if (userData.status !== status) {
          await updateDoc(doc(db, 'users', user.id), { status });
        }
      }
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const fetchCompletedTasks = async () => {
    if (!user?.id) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tasksQuery = query(
        collection(db, 'taskRewards'),
        where('userId', '==', user.id),
        where('completedAt', '>=', today)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const completed = new Set<string>();
      
      tasksSnapshot.forEach(doc => {
        const data = doc.data();
        completed.add(data.taskId);
      });
      
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task: Task) => {
    if (userStatus === 'inactive') {
      setShowInactiveModal(true);
      return;
    }

    if (completedTasks.has(task.id)) {
      toast.info('Task already completed today!');
      return;
    }

    setProcessingTask(task.id);

    try {
      // Handle different task types
      if (task.id === 'share_link' && task.url) {
        window.open(task.url, '_blank');
      } else if (task.id === 'follow_telegram' && task.url) {
        window.open(task.url, '_blank');
      } else if (task.id === 'refer_friend') {
        const referralLink = `${window.location.origin}?ref=${user?.id}`;
        await navigator.clipboard.writeText(referralLink);
        toast.success('Referral link copied to clipboard!');
      }

      // Complete the task
      await completeTask(task);
      
    } catch (error) {
      console.error('Error handling task:', error);
      toast.error('Failed to complete task');
    } finally {
      setProcessingTask(null);
    }
  };

  const completeTask = async (task: Task) => {
    if (!user?.id) return;

    try {
      // Add task completion record
      const taskCompletion: TaskCompletion = {
        userId: user.id,
        taskId: task.id,
        amount: task.reward,
        completedAt: serverTimestamp()
      };

      await setDoc(
        doc(collection(db, 'taskRewards')),
        taskCompletion
      );

      // Update user's mining balance
      await updateDoc(doc(db, 'users', user.id), {
        'wallet.miningBalance': increment(task.reward)
      });

      // Update local state
      setCompletedTasks(prev => new Set([...prev, task.id]));
      
      toast.success(`Task completed! +${task.reward} DLX earned`);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const getTotalEarnings = () => {
    return Array.from(completedTasks).reduce((total, taskId) => {
      const task = DAILY_TASKS.find(t => t.id === taskId);
      return total + (task?.reward || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/3 mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                userStatus === 'active' 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-pointer hover:bg-red-500/30'
              }`}
              onClick={() => userStatus === 'inactive' && setShowInactiveModal(true)}
              >
                {userStatus === 'active' ? 'Active ✅' : 'Inactive ❌'}
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <GiftIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-slate-400 text-sm">Today's Earnings</p>
                  <p className="text-white text-xl font-bold">{getTotalEarnings()} DLX</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-slate-400 text-sm">Completed</p>
                  <p className="text-white text-xl font-bold">{completedTasks.size}/{DAILY_TASKS.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className="text-white text-xl font-bold capitalize">{userStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-4">
          {DAILY_TASKS.map((task) => {
            const isCompleted = completedTasks.has(task.id);
            const isProcessing = processingTask === task.id;
            const IconComponent = task.icon;
            
            return (
              <div
                key={task.id}
                className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 transition-all duration-200 ${
                  isCompleted 
                    ? 'border-green-500/30 bg-green-500/5' 
                    : userStatus === 'inactive'
                    ? 'border-slate-700 hover:border-red-500/30 cursor-pointer'
                    : 'border-slate-700 hover:border-blue-500/30 cursor-pointer hover:bg-slate-800/70'
                }`}
                onClick={() => !isCompleted && handleTaskClick(task)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${
                      isCompleted 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    <div>
                      <h3 className="text-white font-semibold text-lg">{task.title}</h3>
                      <p className="text-slate-400 text-sm">{task.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-yellow-400 font-medium">+{task.reward} DLX</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isCompleted ? (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    ) : (
                      <button
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          userStatus === 'inactive'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isProcessing ? 'Processing...' : task.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inactive User Modal */}
        <Transition appear show={showInactiveModal} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setShowInactiveModal(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 p-6 text-left align-middle shadow-xl transition-all">
                    <div className="flex items-center space-x-3 mb-4">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
                      <Dialog.Title as="h3" className="text-lg font-medium text-white">
                        Account Activation Required
                      </Dialog.Title>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-slate-300 text-sm leading-relaxed">
                        To activate your account, purchase any digital product or service from the DigiLinex store. 
                        Once purchased, your account will automatically become Active, and you'll start earning daily rewards and unlock tasks.
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        onClick={() => {
                          setShowInactiveModal(false);
                          window.location.href = '/digital-products';
                        }}
                      >
                        Go to Products
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors"
                        onClick={() => setShowInactiveModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}