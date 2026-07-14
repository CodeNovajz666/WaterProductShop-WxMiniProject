<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUserCommentsAPI, deleteUgcCommentAPI } from '@/services/seafood'
import type { UgcComment } from '@/services/seafood'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

const comments = ref<UgcComment[]>([])
const loading = ref(false)

const loadComments = async () => {
  loading.value = true
  try {
    const res = await getUserCommentsAPI()
    comments.value = res.result
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}

const onDelete = (comment: UgcComment) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条评价吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await deleteUgcCommentAPI(comment.ugcId, comment.id)
        if (result.code === '0') {
          comments.value = comments.value.filter((c) => c.id !== comment.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.msg, icon: 'none' })
        }
      } catch {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

const onGoUgcDetail = (ugcId: string) => {
  uni.navigateTo({ url: `/pages/ugc-detail/ugc-detail?id=${ugcId}` })
}

const goBack = () => uni.navigateBack()

onShow(() => {
  loadComments()
})
</script>

<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">我的评价</text>
      <view class="header-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content" enable-back-to-top>
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="comments.length === 0" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text">暂无评价记录</text>
        <text class="empty-hint">在分享详情中发表评论后，会在这里显示</text>
      </view>

      <!-- 评论列表 -->
      <view v-else class="comment-list">
        <view
          v-for="item in comments"
          :key="item.id"
          class="comment-card"
        >
          <!-- 关联的分享信息 -->
          <view class="ugc-info" @tap="onGoUgcDetail(item.ugcId)">
            <image
              v-if="item.ugcGoodsImage"
              class="ugc-thumb"
              :src="item.ugcGoodsImage"
              mode="aspectFill"
            />
            <view class="ugc-meta">
              <text class="ugc-title">{{ item.ugcTitle || '分享内容' }}</text>
              <text class="ugc-link">查看分享详情 →</text>
            </view>
          </view>

          <!-- 评论内容 -->
          <view class="comment-body">
            <view class="comment-top">
              <view class="comment-avatar">
                <text class="avatar-text">{{ item.userName.charAt(0) }}</text>
              </view>
              <view class="comment-info">
                <text class="comment-user">{{ item.userName }}</text>
                <text class="comment-time">{{ item.createdAt }}</text>
              </view>
              <view class="comment-delete-btn" @tap="onDelete(item)">
                <text>删除</text>
              </view>
            </view>
            <text class="comment-content-text">{{ item.content }}</text>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 20rpx;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);

  .header-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .back-icon {
      font-size: 40rpx;
      color: #fff;
    }
  }

  .header-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-placeholder {
    width: 60rpx;
  }
}

/* 内容区 */
.content {
  flex: 1;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;

  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #bbb;
  }
}

/* 评论卡片 */
.comment-list {
  padding: 20rpx;
}

.comment-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 关联分享信息 */
.ugc-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-bottom: 1rpx solid #f0f0f0;

  &:active {
    background: #f0f4f8;
  }

  .ugc-thumb {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .ugc-meta {
    flex: 1;
    margin-left: 16rpx;
    overflow: hidden;
  }

  .ugc-title {
    font-size: 26rpx;
    color: #555;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ugc-link {
    font-size: 22rpx;
    color: #0066cc;
    margin-top: 6rpx;
  }
}

/* 评论内容 */
.comment-body {
  padding: 20rpx;
}

.comment-top {
  display: flex;
  align-items: center;
}

.comment-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .avatar-text {
    font-size: 24rpx;
    color: #fff;
    font-weight: bold;
  }
}

.comment-info {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;

  .comment-user {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
  }

  .comment-time {
    font-size: 22rpx;
    color: #aaa;
    margin-top: 4rpx;
  }
}

.comment-delete-btn {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  background: #fff0f0;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #ff6b6b;
  }

  &:active {
    opacity: 0.6;
  }
}

.comment-content-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-top: 16rpx;
  display: block;
}

.bottom-space {
  height: 60rpx;
}
</style>
