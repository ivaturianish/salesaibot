import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import TokenUsage from '@/models/TokenUsage';
import { getCurrentUser } from '@/lib/auth';

// GET endpoint to retrieve token usage
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';

    // Connect to database
    await connectToDatabase();

    // Get session usage
    const sessionUsage = await TokenUsage.aggregate([
      {
        $match: {
          userId: currentUser.id,
          sessionId,
        },
      },
      {
        $group: {
          _id: null,
          promptTokens: { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' },
          estimatedCost: { $sum: '$estimatedCost' },
        },
      },
    ]);

    // Get total usage
    const totalUsage = await TokenUsage.aggregate([
      {
        $match: {
          userId: currentUser.id,
        },
      },
      {
        $group: {
          _id: null,
          promptTokens: { $sum: '$promptTokens' },
          completionTokens: { $sum: '$completionTokens' },
          totalTokens: { $sum: '$totalTokens' },
          estimatedCost: { $sum: '$estimatedCost' },
        },
      },
    ]);

    // Format response
    const sessionUsageData = sessionUsage.length > 0
      ? {
          promptTokens: sessionUsage[0].promptTokens,
          completionTokens: sessionUsage[0].completionTokens,
          totalTokens: sessionUsage[0].totalTokens,
          estimatedCost: sessionUsage[0].estimatedCost,
          model: 'gemini-pro', // Default model
        }
      : {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
          model: 'gemini-pro',
        };

    const totalUsageData = totalUsage.length > 0
      ? {
          promptTokens: totalUsage[0].promptTokens,
          completionTokens: totalUsage[0].completionTokens,
          totalTokens: totalUsage[0].totalTokens,
          estimatedCost: totalUsage[0].estimatedCost,
          model: 'gemini-pro', // Default model
        }
      : {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCost: 0,
          model: 'gemini-pro',
        };

    return NextResponse.json({
      sessionUsage: sessionUsageData,
      totalUsage: totalUsageData,
    });
  } catch (error: any) {
    console.error('Error getting token usage:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while getting token usage' },
      { status: 500 }
    );
  }
}

// POST endpoint to add token usage
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get request body
    const {
      sessionId = 'default',
      messageId,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost,
      model = 'gemini-pro',
    } = await request.json();

    // Validate required fields
    if (!messageId || promptTokens === undefined || completionTokens === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Create token usage record
    const tokenUsage = new TokenUsage({
      userId: currentUser.id,
      sessionId,
      messageId,
      promptTokens,
      completionTokens,
      totalTokens: totalTokens || (promptTokens + completionTokens),
      estimatedCost,
      model,
    });

    await tokenUsage.save();

    return NextResponse.json({
      success: true,
      tokenUsage,
    });
  } catch (error: any) {
    console.error('Error saving token usage:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while saving token usage' },
      { status: 500 }
    );
  }
}
