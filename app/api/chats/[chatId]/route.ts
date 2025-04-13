import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Chat from '@/models/Chat';
import { getCurrentUser } from '@/lib/auth';

// Get a specific chat by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Find the chat by ID and user ID
    const chat = await Chat.findOne({
      _id: params.chatId,
      userId: currentUser.userId,
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error: any) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching chat' },
      { status: 500 }
    );
  }
}

// Update a chat
export async function PUT(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Parse the request body
    const { title, messages } = await request.json();

    // Find the chat by ID and user ID
    const chat = await Chat.findOne({
      _id: params.chatId,
      userId: currentUser.userId,
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Update the chat
    if (title !== undefined) {
      chat.title = title;
    }
    if (messages !== undefined) {
      chat.messages = messages;
    }

    await chat.save();

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error: any) {
    console.error('Update chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while updating chat' },
      { status: 500 }
    );
  }
}

// Delete a chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Get current user from token
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Find and delete the chat by ID and user ID
    const result = await Chat.deleteOne({
      _id: params.chatId,
      userId: currentUser.userId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while deleting chat' },
      { status: 500 }
    );
  }
}
