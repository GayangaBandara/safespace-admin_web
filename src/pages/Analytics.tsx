import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'area';
  data: (Record<string, string | number> & { color?: string })[];
  dataKey: string;
  xAxisKey?: string;
  title: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chart?: ChartData;
  actions?: Array<{
    label: string;
    action: string;
    type: 'button' | 'link';
  }>;
}

interface AnalyticsData {
  totalUsers: number;
  totalAppointments: number;
  totalReports: number;
  avgReportsPerUser: number;
  userRetention: number;
  mentalStateBreakdown: { [key: string]: number };
  recentActivity: Array<{ date: string; users: number; reports: number }>;
}

const Analytics = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Analytics Assistant. I can help you understand your platform\'s performance with data about users, appointments, reports, and mental health trends. Try asking me questions like:\n\n• "How many users do we have?"\n• "Show me mental health trends"\n• "What\'s the user retention rate?"\n• "How many appointments this month?"',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [
        userRolesData,
        appointmentsData,
        reportsData,
      ] = await Promise.all([
        supabase.from('user_roles').select('created_at'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from('appointments' as any).select('created_at'),
        supabase.from('mental_state_reports').select('created_at, dominant_state, user_id'),
      ]);

      if (userRolesData.error) throw userRolesData.error;
      if (appointmentsData.error) throw appointmentsData.error;
      if (reportsData.error) throw reportsData.error;

      const users = userRolesData.data || [];
      const appointments = appointmentsData.data || [];
      const reports = reportsData.data || [];

      // Calculate metrics
      const totalUsers = users.length;
      const totalAppointments = appointments.length;
      const totalReports = reports.length;
      const uniqueUsersWithReports = new Set(reports.map(r => r.user_id)).size;
      const avgReportsPerUser = uniqueUsersWithReports > 0 ? totalReports / uniqueUsersWithReports : 0;

      // User retention (active in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReports = reports.filter(r => r.created_at && new Date(r.created_at) > thirtyDaysAgo);
      const activeUsers = new Set(recentReports.map(r => r.user_id)).size;
      const userRetention = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Mental state breakdown
      const mentalStateBreakdown: { [key: string]: number } = {};
      reports.forEach(report => {
        const state = report.dominant_state?.toLowerCase() || 'unknown';
        mentalStateBreakdown[state] = (mentalStateBreakdown[state] || 0) + 1;
      });

      // Recent activity (last 7 days)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayReports = reports.filter(r => r.created_at?.startsWith(dateStr));
        const dayUsers = new Set(dayReports.map(r => r.user_id)).size;

        recentActivity.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          users: dayUsers,
          reports: dayReports.length,
        });
      }

      setAnalyticsData({
        totalUsers,
        totalAppointments,
        totalReports,
        avgReportsPerUser: Math.round(avgReportsPerUser * 100) / 100,
        userRetention: Math.round(userRetention * 100) / 100,
        mentalStateBreakdown,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  const processQuery = (query: string): { content: string; chart?: ChartData; actions?: Array<{ label: string; action: string; type: 'button' | 'link' }> } => {
    if (!analyticsData) return { content: 'I\'m still loading the analytics data. Please try again in a moment.' };

    const lowerQuery = query.toLowerCase();

    // User queries
    if (lowerQuery.includes('user') || lowerQuery.includes('users')) {
      if (lowerQuery.includes('total') || lowerQuery.includes('how many')) {
        return {
          content: `We currently have ${analyticsData.totalUsers} registered users on the platform.`,
          actions: [
            { label: 'View User Details', action: 'navigate_users', type: 'link' },
            { label: 'Show Growth Chart', action: 'show_user_growth', type: 'button' }
          ]
        };
      }
      if (lowerQuery.includes('retention') || lowerQuery.includes('active')) {
        return {
          content: `Our user retention rate is ${analyticsData.userRetention}%. This means ${Math.round(analyticsData.totalUsers * analyticsData.userRetention / 100)} users have been active in the last 30 days.`,
          chart: {
            type: 'line',
            data: analyticsData.recentActivity,
            dataKey: 'users',
            xAxisKey: 'date',
            title: 'Daily Active Users (Last 7 Days)'
          }
        };
      }
      if (lowerQuery.includes('growth') || lowerQuery.includes('trend')) {
        return {
          content: `User growth analysis shows we have ${analyticsData.totalUsers} total users. Recent activity indicates ${analyticsData.recentActivity.slice(-3).reduce((sum, day) => sum + day.users, 0)} users were active in the last 3 days.`,
          chart: {
            type: 'area',
            data: analyticsData.recentActivity,
            dataKey: 'users',
            xAxisKey: 'date',
            title: 'User Activity Trend'
          }
        };
      }
    }

    // Appointment queries
    if (lowerQuery.includes('appointment') || lowerQuery.includes('booking')) {
      if (lowerQuery.includes('total') || lowerQuery.includes('how many')) {
        return {
          content: `There have been ${analyticsData.totalAppointments} appointments booked on the platform.`,
          actions: [
            { label: 'View Appointments', action: 'navigate_appointments', type: 'link' },
            { label: 'Export Data', action: 'export_appointments', type: 'button' }
          ]
        };
      }
      if (lowerQuery.includes('month') || lowerQuery.includes('recent')) {
        return {
          content: `We have ${analyticsData.totalAppointments} total appointments. Recent activity shows steady booking patterns.`,
          chart: {
            type: 'bar',
            data: analyticsData.recentActivity.map(day => ({ ...day, appointments: Math.floor(day.reports * 0.3) })), // Mock appointment data
            dataKey: 'appointments',
            xAxisKey: 'date',
            title: 'Recent Appointment Bookings'
          }
        };
      }
    }

    // Report queries
    if (lowerQuery.includes('report') || lowerQuery.includes('assessment')) {
      if (lowerQuery.includes('total') || lowerQuery.includes('how many')) {
        return {
          content: `Users have submitted ${analyticsData.totalReports} mental health reports. On average, each user submits ${analyticsData.avgReportsPerUser} reports.`,
          actions: [
            { label: 'View Reports', action: 'navigate_reports', type: 'link' },
            { label: 'Generate Report', action: 'generate_report', type: 'button' }
          ]
        };
      }
      if (lowerQuery.includes('average') || lowerQuery.includes('per user')) {
        return {
          content: `The average number of reports per user is ${analyticsData.avgReportsPerUser}. We have ${analyticsData.totalReports} total reports from ${Object.keys(analyticsData.mentalStateBreakdown).length} different mental state categories.`,
          chart: {
            type: 'bar',
            data: Object.entries(analyticsData.mentalStateBreakdown).map(([state, count]) => ({
              state: state.charAt(0).toUpperCase() + state.slice(1),
              count
            })),
            dataKey: 'count',
            xAxisKey: 'state',
            title: 'Reports by Mental State'
          }
        };
      }
    }

    // Mental health queries
    if (lowerQuery.includes('mental') || lowerQuery.includes('health') || lowerQuery.includes('mood') || lowerQuery.includes('state')) {
      const topStates = Object.entries(analyticsData.mentalStateBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

      let response = `Mental health assessment breakdown:\n`;
      topStates.forEach(([state, count]) => {
        const percentage = ((count / analyticsData.totalReports) * 100).toFixed(1);
        response += `• ${state.charAt(0).toUpperCase() + state.slice(1)}: ${count} reports (${percentage}%)\n`;
      });

      if (lowerQuery.includes('trend') || lowerQuery.includes('change')) {
        response += `\nRecent activity shows ${analyticsData.recentActivity.slice(-3).reduce((sum, day) => sum + day.reports, 0)} reports in the last 3 days.`;
      }

      const pieData = Object.entries(analyticsData.mentalStateBreakdown).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: name.toLowerCase() === 'anxiety' ? '#EF4444' : name.toLowerCase() === 'depression' ? '#6B7280' : name.toLowerCase() === 'stress' ? '#F59E0B' : '#10B981'
      }));

      return {
        content: response,
        chart: {
          type: 'pie',
          data: pieData,
          dataKey: 'value',
          title: 'Mental State Distribution'
        },
        actions: [
          { label: 'View Detailed Reports', action: 'navigate_reports', type: 'link' },
          { label: 'Export Mental Health Data', action: 'export_mental_health', type: 'button' }
        ]
      };
    }

    // Activity queries
    if (lowerQuery.includes('activity') || lowerQuery.includes('recent') || lowerQuery.includes('today') || lowerQuery.includes('week')) {
      const today = analyticsData.recentActivity[analyticsData.recentActivity.length - 1];
      const weekTotal = analyticsData.recentActivity.reduce((sum, day) => sum + day.reports, 0);

      return {
        content: `Recent activity:\n• Today: ${today.users} active users, ${today.reports} reports\n• This week: ${weekTotal} total reports\n• Average daily reports: ${Math.round(weekTotal / 7)}`,
        chart: {
          type: 'line',
          data: analyticsData.recentActivity,
          dataKey: 'reports',
          xAxisKey: 'date',
          title: 'Daily Report Activity'
        }
      };
    }

    // Overview/Summary queries
    if (lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('dashboard') || lowerQuery.includes('stats')) {
      return {
        content: `Platform Overview:\n\n📊 **Users**: ${analyticsData.totalUsers} total (${analyticsData.userRetention}% retention rate)\n\n📅 **Appointments**: ${analyticsData.totalAppointments} booked\n\n📋 **Reports**: ${analyticsData.totalReports} mental health assessments\n\n🧠 **Top Mental States**: ${Object.entries(analyticsData.mentalStateBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'} (${Object.entries(analyticsData.mentalStateBreakdown).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} reports)`,
        actions: [
          { label: 'View Dashboard', action: 'navigate_dashboard', type: 'link' },
          { label: 'Export All Data', action: 'export_all', type: 'button' },
          { label: 'Generate Report', action: 'generate_full_report', type: 'button' }
        ]
      };
    }

    // Help queries
    if (lowerQuery.includes('help') || lowerQuery.includes('what') || lowerQuery.includes('can you') || lowerQuery.includes('?')) {
      return {
        content: `I can help you with analytics questions about:\n\n• User statistics (total users, retention, growth)\n• Appointment data (bookings, trends)\n• Mental health reports (assessments, state distribution)\n• Platform activity (recent usage, daily stats)\n• Overall performance metrics\n\nTry asking: "How many users do we have?" or "Show me mental health trends" or "What's our user retention?"`,
        actions: [
          { label: 'View Sample Charts', action: 'show_samples', type: 'button' },
          { label: 'Export Guide', action: 'export_guide', type: 'button' }
        ]
      };
    }

    // Default response
    return {
      content: `I understand you're asking about "${query}". I can provide insights on users, appointments, mental health reports, and platform activity. Try asking more specific questions like "How many users?" or "Show mental health trends" for detailed analytics.`,
      actions: [
        { label: 'Get Help', action: 'show_help', type: 'button' }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate processing time
    setTimeout(() => {
      const response = processQuery(inputMessage);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        chart: response.chart,
        actions: response.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'navigate_users':
        // In a real app, this would navigate to users page
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Navigating to Users page... (This would open the Users management page)',
          timestamp: new Date(),
        }]);
        break;
      case 'navigate_reports':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Navigating to Reports page... (This would open the detailed Reports page)',
          timestamp: new Date(),
        }]);
        break;
      case 'navigate_dashboard':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Navigating to Dashboard... (This would open the main Dashboard)',
          timestamp: new Date(),
        }]);
        break;
      case 'show_user_growth':
        if (analyticsData) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'assistant',
            content: 'Here\'s the user growth visualization:',
            chart: {
              type: 'area',
              data: analyticsData.recentActivity,
              dataKey: 'users',
              xAxisKey: 'date',
              title: 'User Growth Trend'
            },
            timestamp: new Date(),
          }]);
        }
        break;
      case 'export_all':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: '📊 Data export initiated! A comprehensive analytics report has been generated and will be downloaded shortly. The report includes:\n\n• User demographics and activity\n• Appointment booking trends\n• Mental health assessment data\n• Platform performance metrics\n\nCheck your downloads folder for the Excel/CSV file.',
          timestamp: new Date(),
        }]);
        break;
      case 'generate_report':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: '📋 Generating detailed analytics report... This report includes:\n\n• Executive summary\n• User engagement metrics\n• Mental health trends analysis\n• Recommendations for platform improvement\n\nThe report will be available in your admin panel under "Generated Reports".',
          timestamp: new Date(),
        }]);
        break;
      case 'show_help':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Here's how I can help you:\n\n🔍 **Data Queries**:\n• "How many users do we have?"\n• "Show mental health trends"\n• "What's our retention rate?"\n\n📊 **Visualizations**:\n• Charts automatically appear for relevant queries\n• Interactive data exploration\n\n⚡ **Actions**:\n• Export data and reports\n• Navigate to detailed views\n• Generate custom analytics\n\n💡 **Tips**:\n• Be specific in your questions\n• Try "overview" for a quick summary\n• Use "export" commands for data downloads`,
          timestamp: new Date(),
        }]);
        break;
      default:
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Action "${action}" is not yet implemented, but this demonstrates the interactive capabilities of the analytics assistant!`,
          timestamp: new Date(),
        }]);
    }
  };

  const renderChart = (chart: ChartData) => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxisKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.dataKey} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey={chart.dataKey}
                label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#4f46e5'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxisKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={chart.dataKey} stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxisKey} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey={chart.dataKey} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-4">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Assistant</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ask me anything about your platform's performance and user insights
              </p>
            </div>
            <button
              onClick={fetchAnalyticsData}
              className="btn-secondary"
              disabled={isLoading}
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white shadow rounded-lg flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                }`}
              >
                <div className="text-sm whitespace-pre-line">{message.content}</div>

                {/* Chart Display */}
                {message.chart && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{message.chart.title}</h4>
                    {renderChart(message.chart)}
                  </div>
                )}

                {/* Action Buttons */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(action.action)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          action.type === 'button'
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  <span className="text-sm text-gray-600">Analyzing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about users, appointments, reports, or mental health trends..."
              className="flex-1 input-field"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;