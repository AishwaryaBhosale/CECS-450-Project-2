#!/usr/bin/env python
# coding: utf-8

# # Libraries

# In[20]:


import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
import sys
import warnings
warnings.filterwarnings("ignore")


# # Loading Data

# In[21]:


treeEvd = pd.read_csv("p5.treeEVD.txt", sep = "\t", header=None)
treeEvd.rename(columns = {0:'time', 
                     1: 'event', 
                     2: 'event_key', 
                     3: 'data1', 
                     4: 'data2',
                     5:'description'}, inplace = True)
treeEvd.head()


# In[22]:


treeFxd = pd.read_csv("p5.treeFXD.txt", sep = "\t", header=None)
treeFxd.rename(columns = {0:'number', 
                     1: 'time', 
                     2: 'duration', 
                     3: 'x', 
                     4: 'y'}, inplace = True)
treeFxd.head()


# In[23]:


treeGzd =  pd.read_csv("p5.treeGZD.txt", sep = "\t", header=None)
treeGzd.rename(columns ={0:'time', 
                     1: 'number', 
                     2: 'screen_x_left_eye', 
                     3: 'screen_y_left_eye', 
                     4: 'cam_x_left_eye',
                     5:'cam_y_left_eye',
                     6:'distance_left_eye',
                     7:'pupil_left_eye',
                     8:'code_left_eye', 
                    9:'screen_x_right_eye', 
                    10:'screen_y_right_eye',
                    11:'cam_x_rigth_eye',
                    12:'cam_y_right_eye',
                    13:'distance_right_eye', 
                    14:'pupil_right_eye', 
                    15:'code_right_eye'},inplace = True)
treeGzd.head()


# In[24]:


graphEvd = pd.read_csv("p5.graphEVD.txt", sep = "\t",names=['time','event','event_key','data1','data2','description'])

graphEvd.head(10)


# In[25]:


graphFxd = pd.read_csv("p5.graphFXD.txt", sep = "\t", header=None)
graphFxd.rename(columns = {0:'number', 
                     1: 'time', 
                     2: 'duration', 
                     3: 'x', 
                     4: 'y'}, inplace = True)
graphFxd.head()


# In[26]:


graphGzd = pd.read_csv("p5.graphGZD.txt", sep = "\t", header=None)
graphGzd.rename(columns ={0:'time', 
                     1: 'number', 
                     2: 'screen_x_left_eye', 
                     3: 'screen_y_left_eye', 
                     4: 'cam_x_left_eye',
                     5:'cam_y_left_eye',
                     6:'distance_left_eye',
                     7:'pupil_left_eye',
                     8:'code_left_eye', 
                    9:'screen_x_right_eye', 
                    10:'screen_y_right_eye',
                    11:'cam_x_rigth_eye',
                    12:'cam_y_right_eye',
                    13:'distance_right_eye', 
                    14:'pupil_right_eye', 
                    15:'code_right_eye'},inplace = True)
graphGzd.head()


# In[27]:


baselineGzd =  pd.read_csv("p5GZD.txt", sep = "\t", header=None)
baselineGzd.rename(columns ={0:'time', 
                     1: 'number', 
                     2: 'screen_x_left_eye', 
                     3: 'screen_y_left_eye', 
                     4: 'cam_x_left_eye',
                     5:'cam_y_left_eye',
                     6:'distance_left_eye',
                     7:'pupil_left_eye',
                     8:'code_left_eye', 
                    9:'screen_x_right_eye', 
                    10:'screen_y_right_eye',
                    11:'cam_x_rigth_eye',
                    12:'cam_y_right_eye',
                    13:'distance_right_eye', 
                    14:'pupil_right_eye', 
                    15:'code_right_eye'},inplace = True)
#for considering the correct values
baselineGzd= baselineGzd.loc[((baselineGzd['code_left_eye'] == 0) & (baselineGzd['code_right_eye'] == 0))]
baselineGzd.head()


# # Extracting relevant data and propping columns that are not required.
# <ul>
#     <li>Considereing only valid data for making the visualization where the code_left and code_right is zero is where the 
#         value of pupil dilation is valid</li>
#     <li>Removing values where there are negative values for pupil left and pupil right value </li>
# </ul>

# In[28]:



finalTree = treeGzd.loc[((treeGzd['code_left_eye'] == 0) & (treeGzd['code_right_eye'] == 0))]
finalTree = finalTree.drop(['screen_x_left_eye','screen_y_left_eye','cam_x_left_eye','cam_y_left_eye',
                                    'distance_left_eye','screen_x_right_eye','screen_y_right_eye','cam_x_rigth_eye', 
                                    'cam_y_right_eye', 'distance_right_eye','code_left_eye','code_right_eye'],axis = 1)
finalTree.head()


# In[29]:


finalGraph = graphGzd.loc[((graphGzd['code_left_eye'] == 0) & (graphGzd['code_right_eye'] == 0))]
finalGraph = finalGraph.drop(['screen_x_left_eye','screen_y_left_eye','cam_x_left_eye','cam_y_left_eye',
                     'distance_left_eye','screen_x_right_eye','screen_y_right_eye','cam_x_rigth_eye', 
                     'cam_y_right_eye', 'distance_right_eye','code_left_eye','code_right_eye'],axis = 1)
finalGraph.head()


# # Cleaning the data

# In[30]:


#Removing the values form final tree where there are negative values for pupil_left_eye and pupil_right_eye values
finalTree = finalTree[((finalTree.pupil_left_eye > 0 )& (finalTree.pupil_right_eye>0))]
finalTree.head()


# In[31]:


#Removing the values form final graph where there are negative values for pupil_left_eye and pupil_right_eye values
finalGraph = finalGraph[((finalGraph.pupil_left_eye > 0 )& (finalGraph.pupil_right_eye>0))]
finalGraph.head()


# In[32]:


# Calculating the avg of pupil size in baseline data
baseline_left_eye_mean  = baselineGzd['pupil_left_eye'].mean()
baseline_right_eye_mean = baselineGzd['pupil_right_eye'].mean()
average_pupil_size_baseline = (baseline_left_eye_mean+baseline_right_eye_mean)/2
print('The average pupil size of the baseline data is {}'.format(average_pupil_size_baseline))


# In[33]:


# Calculating  average pupil dilation size of graph gaze data from pupil_left_eye and pupil_right_eye of tree gaze data
finalTree['avg_dilation'] = finalTree[['pupil_left_eye', 'pupil_right_eye']].mean(axis=1)
finalTree['avg_dilation'] = abs(finalTree['avg_dilation']-average_pupil_size_baseline)
finalTree=finalTree.drop(['pupil_left_eye','pupil_right_eye'],axis=1)
finalTree.head()


# In[34]:


# Calculating  average pupil dilation size of graph gaze data from pupil_left_eye and pupilt_right_eye of graph gaze data
finalGraph['avg_dilation'] = finalGraph[['pupil_left_eye', 'pupil_right_eye']].mean(axis=1)
finalGraph['avg_dilation'] = abs(finalGraph['avg_dilation']-average_pupil_size_baseline)
finalGraph=finalGraph.drop(['pupil_left_eye','pupil_right_eye'],axis=1)
finalGraph.head()


# # Data preparation for visualization

# In[35]:


# Performing left join on fixation data to see change in avg_dilation with size in treeFxd
mergedTree = pd.merge(treeFxd, finalTree, on = 'time', how = 'left')
mergedTree = mergedTree.drop(['number_x','number_y'], axis = 1)
mergedTree.head()


# In[36]:


# Performing left join on fixation data to see change in avg_dilation with size in graphFxd
mergedGraph = pd.merge(graphFxd, finalGraph, on = 'time', how = 'left')
mergedGraph = mergedGraph.drop(['number_x','number_y'], axis = 1)
mergedGraph.head()


# # Convert to csv for rendering
# 

# In[37]:


mergedTree.to_csv('mergedTree.csv', index = False)
mergedGraph.to_csv('mergedGraph.csv', index = False)


# In[ ]:




