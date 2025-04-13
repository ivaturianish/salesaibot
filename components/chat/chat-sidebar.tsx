'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  MoreVertical,
  Search,
  Settings,
  LogOut
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import AnimatedElement from '@/components/animated-element';

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
}

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  
  const [isOpen, setIsOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  
  // Fetch chat history
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would fetch from an API
        // For now, we'll use mock data
        const mockChats: Chat[] = [
          {
            id: '1',
            title: 'Objection Handling Techniques',
            updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            preview: 'How do I handle price objections effectively?'
          },
          {
            id: '2',
            title: 'Closing Strategies',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            preview: 'What are the best closing techniques for enterprise sales?'
          },
          {
            id: '3',
            title: 'Discovery Questions',
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            preview: 'Help me craft effective discovery questions for my next call.'
          }
        ];
        
        setChats(mockChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast({
          title: 'Failed to load chat history',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChats();
  }, [toast]);
  
  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle new chat
  const handleNewChat = () => {
    router.push('/chat');
  };
  
  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };
  
  // Handle chat deletion
  const handleDeleteChat = async (chatId: string) => {
    try {
      // In a real implementation, this would call an API
      setChats(chats.filter(chat => chat.id !== chatId));
      
      toast({
        title: 'Chat deleted',
        description: 'The chat has been deleted successfully.',
      });
      
      // If we're currently viewing the deleted chat, redirect to new chat
      if (pathname === `/chat/${chatId}`) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: 'Failed to delete chat',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };
  
  // Handle chat edit
  const handleEditChat = async (chatId: string, newTitle: string) => {
    try {
      // In a real implementation, this would call an API
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ));
      
      toast({
        title: 'Chat renamed',
        description: 'The chat has been renamed successfully.',
      });
    } catch (error) {
      console.error('Error editing chat:', error);
      toast({
        title: 'Failed to rename chat',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setEditingChatId(null);
      setEditTitle('');
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className={`flex flex-col h-full border-r border-border/40 bg-background/80 backdrop-blur transition-all duration-300 ${isOpen ? 'w-80' : 'w-0'}`}>
      {isOpen && (
        <AnimatedElement type="fade-in" duration={300}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <span className="text-primary animate-pulse-glow">GoCloser</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="md:hidden">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            
            {/* New Chat Button */}
            <div className="px-4 pb-2">
              <Button 
                variant="gradient" 
                className="w-full justify-start gap-2 rounded-lg"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>
            
            {/* Search */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  className="pl-9 bg-accent/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <Separator className="my-2" />
            
            {/* Chat List */}
            <ScrollArea className="flex-1 px-2">
              {isLoading ? (
                <div className="flex flex-col gap-2 px-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-accent/30 animate-pulse" />
                  ))}
                </div>
              ) : filteredChats.length > 0 ? (
                <div className="flex flex-col gap-1 px-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/50 ${
                        pathname === `/chat/${chat.id}` ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <div className="flex-1 min-w-0 cursor-pointer">
                        {editingChatId === chat.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditChat(chat.id, editTitle);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex gap-1"
                          >
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button type="submit" size="sm" variant="ghost">
                              Save
                            </Button>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary flex-shrink-0" />
                              <p className="font-medium truncate">{chat.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{chat.preview}</p>
                          </>
                        )}
                      </div>
                      
                      {editingChatId !== chat.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditTitle(chat.title);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(chat.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDate(chat.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 px-4 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No chats found</p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
            
            {/* User Profile */}
            <div className="p-4 border-t border-border/40">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 rounded-lg">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.profilePicture} alt={user?.name || 'User'} />
                      <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user?.name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </AnimatedElement>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
